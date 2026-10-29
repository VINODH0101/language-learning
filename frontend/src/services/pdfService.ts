import { jsPDF } from 'jspdf';
import { PdfExportConfig, VocabularyEntry, EverydaySentenceEntry } from '../types/vocabulary';
import { VocabularyService } from './vocabularyService';

export class PdfService {
  /**
   * Generates and downloads a client-side customized PDF resource.
   */
  static generatePdf(config: PdfExportConfig): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - 18) {
        doc.addPage();
        y = margin;
        renderHeaderBanner();
      }
    };

    const renderHeaderBanner = () => {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text('Lexilume — Illuminate Your Words', margin, 10);
      doc.text(`Target: ${config.target_language.toUpperCase()} | Explanation: ${config.explanation_language.toUpperCase()}`, pageWidth - margin, 10, { align: 'right' });
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, 12, pageWidth - margin, 12);
    };

    // 1. Title Banner
    renderHeaderBanner();
    y = 22;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    const docTitle = config.title || `Lexilume — ${config.target_language.toUpperCase()} Study Guide`;
    doc.text(docTitle, margin, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const subtitle = `Level: ${config.cefr_level.toUpperCase()} | Explanations in ${config.explanation_language.toUpperCase()} | Generated: ${new Date().toLocaleDateString()}`;
    doc.text(subtitle, margin, y);
    y += 10;

    // Divider line
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // 2. Fetch relevant data
    const vocabList: VocabularyEntry[] =
      config.resource_type === 'sentences'
        ? []
        : VocabularyService.getVocabulary({
            target_language: config.target_language,
            cefr_level: config.cefr_level,
            topic: config.topic,
            is_top_200: config.resource_type === 'top_200',
          });

    const sentenceList: EverydaySentenceEntry[] =
      config.resource_type === 'top_200'
        ? []
        : VocabularyService.getSentences(config.target_language, config.topic, config.cefr_level);

    // 3. Render Vocabulary Section
    if (vocabList.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(67, 56, 202);
      doc.text('Essential Vocabulary & Grammar', margin, y);
      y += 6;

      vocabList.forEach((entry, idx) => {
        checkPageBreak(32);

        // Word Card Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

        // Lemma & IPA
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        const lemmaText = `${idx + 1}. ${entry.lemma} ${entry.phonetic_ipa ? `[${entry.phonetic_ipa}]` : ''}`;
        doc.text(lemmaText, margin + 4, y + 6);

        // POS & CEFR Badge
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const metaBadge = `(${entry.part_of_speech}) • CEFR ${entry.cefr_level} • Topic: ${entry.topic}`;
        doc.text(metaBadge, pageWidth - margin - 4, y + 6, { align: 'right' });

        // Translation
        if (config.include_translations) {
          const trans = entry.translations[config.explanation_language] || entry.translations['en'];
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(79, 70, 229);
          doc.text(`Meaning: ${trans}`, margin + 4, y + 11);
        }

        // Definition
        if (config.include_definitions) {
          const def = entry.definitions[config.explanation_language] || entry.definitions['en'];
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          const wrappedDef = doc.splitTextToSize(`Definition: ${def}`, contentWidth - 8);
          doc.text(wrappedDef, margin + 4, y + 15);
        }

        // Example Sentence
        if (config.include_examples) {
          const exTrans = entry.example_sentence_translations[config.explanation_language] || entry.example_sentence_translations['en'];
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          const wrappedEx = doc.splitTextToSize(`Ex: "${entry.example_sentence_target}" — ${exTrans}`, contentWidth - 8);
          doc.text(wrappedEx, margin + 4, y + 20);
        }

        y += 29;
      });
    }

    // 4. Render Everyday Sentences Section
    if (sentenceList.length > 0) {
      checkPageBreak(18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(67, 56, 202);
      doc.text('Everyday Conversational Sentences', margin, y);
      y += 7;

      sentenceList.forEach((sent, idx) => {
        checkPageBreak(18);

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`${idx + 1}. ${sent.sentence_target}`, margin + 4, y + 5);

        if (config.include_translations) {
          const trans = sent.translations[config.explanation_language] || sent.translations['en'];
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(79, 70, 229);
          doc.text(`→ ${trans}`, margin + 4, y + 10);
        }

        y += 17;
      });
    }

    // 5. Practice Quiz Section (if selected)
    if (config.include_practice_quiz && vocabList.length >= 2) {
      checkPageBreak(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('Review Quiz & Knowledge Check', margin, y);
      y += 6;

      const sampleQuiz = vocabList.slice(0, Math.min(5, vocabList.length));
      sampleQuiz.forEach((item, qIdx) => {
        checkPageBreak(20);
        const trans = item.translations[config.explanation_language] || item.translations['en'];
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text(`Q${qIdx + 1}: Translate "${item.lemma}" into ${config.explanation_language.toUpperCase()}:`, margin + 2, y + 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('________________________________________________________', margin + 2, y + 10);
        y += 14;
      });

      // Answer Key
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Answer Key:', margin + 2, y + 4);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const answerStr = sampleQuiz.map((item, i) => `Q${i + 1}: ${item.translations[config.explanation_language] || item.translations['en']}`).join('  |  ');
      const wrappedAnswers = doc.splitTextToSize(answerStr, contentWidth - 4);
      doc.text(wrappedAnswers, margin + 2, y + 2);
      y += 12;
    }

    // 6. Attribution Footer on all pages
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text(
        'Open Educational Resource — CC-BY-SA 4.0 / Tatoeba CC-BY 2.0 FR / HermitDave FrequencyWords',
        margin,
        pageHeight - 8
      );
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }

    // Trigger download
    const filename = `lexilume-${config.target_language}-${config.resource_type}-${config.cefr_level.toLowerCase()}.pdf`;
    doc.save(filename);
  }
}
