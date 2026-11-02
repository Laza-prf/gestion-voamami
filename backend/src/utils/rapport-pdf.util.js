const PDFDocument = require("pdfkit");

function cleanText(value) {
    return String(value ?? "—")
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function formatMoney(value) {
    const formatted = new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Number(value || 0));
    return `${formatted.replace(/[\u00a0\u202f]/g, " ")} MGA`;
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return cleanText(value).slice(0, 10);
    return date.toLocaleDateString("fr-FR", { dateStyle: "long" });
}

function createDocument(res, filename, title, subtitle) {
    const doc = new PDFDocument({
        size: "A4",
        margins: { top: 48, right: 42, bottom: 48, left: 42 },
        bufferPages: true,
        info: { Title: title, Author: "VOAMAMI" }
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
    );
    res.setHeader("Cache-Control", "private, no-store");
    doc.pipe(res);

    doc.fillColor("black")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("VOAMAMI", { continued: true })
        .fillColor("black")
        .font("Helvetica")
        .text("  |  Rapport de gestion");
    doc.moveDown(0.7);
    doc.fillColor("black").font("Helvetica-Bold").fontSize(20).text(title);
    doc.moveDown(0.25);
    doc.fillColor("black").font("Helvetica").fontSize(10).text(subtitle);
    doc.moveDown(0.9);
    doc.strokeColor("black").moveTo(42, doc.y).lineTo(553, doc.y).stroke();
    doc.moveDown(1);

    return doc;
}

function ensureSpace(doc, height = 72) {
    if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
    }
}

function drawSection(doc, title) {
    ensureSpace(doc, 55);
    doc.moveDown(0.5)
        .fillColor("black")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(cleanText(title));
    doc.moveDown(0.4);
}

function drawSummary(doc, entries) {
    doc.font("Helvetica").fontSize(9).fillColor("black").table({
        data: entries.map(([label, value]) => [
            {
                text: cleanText(label),
                type: "TH",
                scope: "row",
                font: { src: "Helvetica-Bold", family: "Helvetica-Bold" }
            },
            { text: cleanText(value), align: "right" }
        ]),
        columnStyles: [{ width: 265 }, { width: 246 }],
        maxWidth: 511,
        defaultStyle: {
            backgroundColor: "white",
            border: 0.5,
            borderColor: "black",
            padding: 5,
            textColor: "black"
        }
    });
    doc.moveDown(0.25);
}

function drawTable(doc, columns, rows) {
    if (!rows?.length) {
        doc.fillColor("black").font("Helvetica").fontSize(9).text("Aucune opération enregistrée.");
        doc.moveDown(0.4);
        return;
    }

    const header = columns.map((column) => ({
        text: cleanText(column.label),
        type: "TH",
        scope: "column",
        font: { src: "Helvetica-Bold", family: "Helvetica-Bold" }
    }));
    const data = rows.map((row) => columns.map((column) => {
        const raw = row[column.key];
        const value = column.format ? column.format(raw, row) : cleanText(raw);
        return { text: cleanText(value) };
    }));
    const declaredWidth = columns.reduce((total, column) => total + column.width, 0);
    const widthScale = 511 / declaredWidth;

    doc.font("Helvetica").fontSize(8).fillColor("black").table({
        data: [header, ...data],
        columnStyles: columns.map((column) => ({ width: column.width * widthScale })),
        maxWidth: 511,
        defaultStyle: {
            backgroundColor: "white",
            border: 0.5,
            borderColor: "black",
            padding: 4,
            textColor: "black"
        }
    });
    doc.moveDown(0.5);
}

function addPageNumbers(doc) {
    const range = doc.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index += 1) {
        doc.switchToPage(index);
        const y = doc.page.height - 32;
        doc.strokeColor("black").moveTo(42, y - 8).lineTo(553, y - 8).stroke();
        doc.fillColor("black").font("Helvetica").fontSize(8)
            .text(`VOAMAMI — ${index + 1} / ${range.count}`, 42, y, {
                width: 511,
                align: "right"
            });
    }
}

function sendPdf(doc) {
    addPageNumbers(doc);
    doc.end();
}

function generateSeancePdf(res, report) {
    const doc = createDocument(
        res,
        `rapport-seance-${report.seance_id}.pdf`,
        `Rapport de la séance S${report.numero_seance}`,
        `${cleanText(report.voamami_code)} — ${cleanText(report.voamami_nom)} | Cycle ${cleanText(report.numero_cycle)} | ${formatDate(report.date_seance)} | ${report.seance_statut === "CLOTUREE" ? "Clôturée" : "Ouverte"}`
    );

    drawSection(doc, "Résumé financier et présence");
    drawSummary(doc, [
        ["Présents / absents / excusés", `${report.total_presents || 0} / ${report.total_absents || 0} / ${report.total_excuses || 0}`],
        ["Épargne collectée", formatMoney(report.total_epargne)],
        ["Crédits accordés", formatMoney(report.total_credits)],
        ["Remboursements reçus", formatMoney(report.total_remboursements)],
        ["Pénalités encaissées", formatMoney(report.total_penalites)],
        ["Total des entrées de caisse", formatMoney(report.total_entrees)],
        ["Total des sorties de caisse", formatMoney(report.total_sorties)],
        ["Solde des mouvements", formatMoney(report.solde)]
    ]);

    drawSection(doc, "Présences");
    drawTable(doc, [
        { key: "numero_membre", label: "N°", width: 40 },
        { key: "nom", label: "Membre", width: 175, format: (_, row) => `${row.nom || ""} ${row.prenom || ""}` },
        { key: "statut", label: "Statut", width: 85 },
        { key: "observation", label: "Observation", width: 199 }
    ], report.presences);

    drawSection(doc, "Épargnes");
    drawTable(doc, [
        { key: "nom", label: "Membre", width: 220, format: (_, row) => `${row.nom || ""} ${row.prenom || ""}` },
        { key: "nombre_parts", label: "Parts", width: 70 },
        { key: "montant_total", label: "Montant", width: 209, format: formatMoney }
    ], report.epargnes);

    drawSection(doc, "Crédits");
    drawTable(doc, [
        { key: "nom", label: "Membre", width: 160, format: (_, row) => `${row.nom || ""} ${row.prenom || ""}` },
        { key: "montant_capital", label: "Capital", width: 95, format: formatMoney },
        { key: "montant_interet", label: "Intérêts", width: 90, format: formatMoney },
        { key: "statut", label: "Statut", width: 154 }
    ], report.credits);

    drawSection(doc, "Remboursements");
    drawTable(doc, [
        { key: "nom", label: "Membre", width: 160, format: (_, row) => `${row.nom || ""} ${row.prenom || ""}` },
        { key: "montant_principal", label: "Capital", width: 95, format: formatMoney },
        { key: "montant_interet", label: "Intérêts", width: 90, format: formatMoney },
        { key: "montant", label: "Total", width: 154, format: formatMoney }
    ], report.remboursements);

    drawSection(doc, "Pénalités");
    drawTable(doc, [
        { key: "nom", label: "Membre", width: 135, format: (_, row) => `${row.nom || ""} ${row.prenom || ""}` },
        { key: "type_penalite", label: "Type", width: 85 },
        { key: "montant", label: "Montant", width: 85, format: formatMoney },
        { key: "statut", label: "Statut", width: 70 },
        { key: "motif", label: "Motif", width: 126 }
    ], report.penalites);

    sendPdf(doc);
}

function generateCyclePdf(res, report) {
    const doc = createDocument(
        res,
        `rapport-cloture-cycle-${report.id}.pdf`,
        `Rapport de clôture du cycle ${report.numero_cycle}`,
        `${cleanText(report.voamami_code)} — ${cleanText(report.voamami_nom)} | Clôturé le ${formatDate(report.date_cloture)}`
    );

    drawSection(doc, "Synthèse du cycle");
    drawSummary(doc, [
        ["Statut du cycle", report.statut],
        ["Nombre de séances", report.nombre_seances],
        ["Membres actifs", report.nombre_membres],
        ["Épargne totale", formatMoney(report.total_epargne)],
        ["Crédits accordés", formatMoney(report.total_credits)],
        ["Remboursements reçus", formatMoney(report.total_remboursements)],
        ["Intérêts encaissés", formatMoney(report.total_interets)],
        ["Pénalités encaissées", formatMoney(report.total_penalites)],
        ["Solde de caisse", formatMoney(report.solde_caisse)]
    ]);

    drawSection(doc, "Partage des bénéfices par membre");
    drawTable(doc, [
        { key: "numero_membre", label: "N°", width: 40 },
        { key: "nom", label: "Membre", width: 138, format: (_, row) => `${row.nom || ""} ${row.prenom || ""}` },
        { key: "capital_membre", label: "Capital", width: 80, format: formatMoney },
        { key: "part_interets", label: "Intérêts", width: 75, format: formatMoney },
        { key: "part_penalites", label: "Pénalités", width: 75, format: formatMoney },
        { key: "montant_total_partage", label: "Total partagé", width: 91, format: formatMoney }
    ], report.partage);

    sendPdf(doc);
}

module.exports = { generateCyclePdf, generateSeancePdf };
