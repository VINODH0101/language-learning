"""
Polyglot C1 Daily — Dual-Track Email Digest Composer.

Renders high-quality responsive HTML and plaintext emails combining
Portuguese and Spanish daily learning material into a single digest.
"""

from __future__ import annotations

from datetime import date
from typing import Optional
import html

from engine.models.lesson import DailyLessonPayload


class DailyDigestComposer:
    """Composes unified, responsive bilingual emails for daily delivery."""

    @staticmethod
    def render_email(
        pt_lesson: Optional[DailyLessonPayload],
        es_lesson: Optional[DailyLessonPayload],
        recipient_name: str = "Polyglot Learner",
        current_date: Optional[date] = None,
        streak_days: int = 1,
        dashboard_url: str = "https://polyglot-c1-daily.pages.dev",
    ) -> tuple[str, str, str]:
        """
        Renders (subject, html_content, text_content).
        Payload is strictly sized < 75 KB to prevent mobile clipping.
        """
        today_str = (current_date or date.today()).strftime("%A, %d %B %Y")
        subject = f"Polyglot C1 Daily — {today_str} (Streak: {streak_days} days)"

        html_body = DailyDigestComposer._render_html(
            pt_lesson=pt_lesson,
            es_lesson=es_lesson,
            recipient_name=recipient_name,
            today_str=today_str,
            streak_days=streak_days,
            dashboard_url=dashboard_url,
        )

        text_body = DailyDigestComposer._render_text(
            pt_lesson=pt_lesson,
            es_lesson=es_lesson,
            recipient_name=recipient_name,
            today_str=today_str,
            streak_days=streak_days,
            dashboard_url=dashboard_url,
        )

        return subject, html_body, text_body

    @staticmethod
    def _render_html(
        pt_lesson: Optional[DailyLessonPayload],
        es_lesson: Optional[DailyLessonPayload],
        recipient_name: str,
        today_str: str,
        streak_days: int,
        dashboard_url: str,
    ) -> str:
        esc = html.escape

        pt_section_html = ""
        if pt_lesson:
            pt_section_html = DailyDigestComposer._render_lesson_html_card(pt_lesson, "Português", "#059669")

        es_section_html = ""
        if es_lesson:
            es_section_html = DailyDigestComposer._render_lesson_html_card(es_lesson, "Español", "#dc2626")

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Polyglot C1 Daily</title>
  <style>
    body {{ margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; }}
    .container {{ max-width: 640px; margin: 0 auto; background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; }}
    .header {{ border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; }}
    .header h1 {{ margin: 0; font-size: 24px; color: #0f172a; }}
    .streak-badge {{ display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 13px; margin-top: 8px; }}
    .track-card {{ border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; margin-bottom: 24px; background: #ffffff; }}
    .track-title {{ font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 8px; }}
    .badge {{ display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #fff; }}
    .vocab-list {{ list-style: none; padding-left: 0; margin: 12px 0; }}
    .vocab-item {{ padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }}
    .vocab-lemma {{ font-weight: bold; font-size: 15px; color: #0f172a; }}
    .vocab-def {{ color: #475569; font-size: 13px; margin-top: 2px; }}
    .vocab-ex {{ font-style: italic; color: #334155; font-size: 13px; margin-top: 4px; }}
    .grammar-box {{ background: #f1f5f9; border-left: 4px solid #0284c7; padding: 12px; margin: 14px 0; border-radius: 0 4px 4px 0; }}
    .grammar-formula {{ font-family: monospace; font-size: 12px; background: #e2e8f0; padding: 2px 6px; border-radius: 3px; }}
    .alert-box {{ background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; margin: 14px 0; color: #92400e; font-size: 13px; }}
    .exercise-box {{ background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 14px; margin-top: 14px; }}
    details {{ margin-top: 8px; cursor: pointer; }}
    summary {{ font-weight: 600; color: #7c3aed; font-size: 13px; outline: none; }}
    .answer-content {{ background: #f3e8ff; padding: 8px 12px; border-radius: 4px; margin-top: 6px; font-size: 13px; color: #581c87; }}
    .btn {{ display: inline-block; background: #0284c7; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; text-align: center; margin: 16px 0; }}
    .footer {{ font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; text-align: center; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Polyglot C1 Daily</h1>
      <div>{esc(today_str)}</div>
      <div class="streak-badge">🔥 {streak_days} Day Streak — Keep Advancing!</div>
    </div>

    <p>Olá e hola, <strong>{esc(recipient_name)}</strong>! Here is your curated Portuguese and Spanish material for today.</p>

    {pt_section_html}
    {es_section_html}

    <div style="text-align: center;">
      <a href="{esc(dashboard_url)}" class="btn">Open Interactive Dashboard</a>
    </div>

    <div class="footer">
      <p>Polyglot C1 Daily — Open Educational Architecture.<br>
      Dictionary entries from Wiktionary (CC-BY-SA 3.0). Authentic sentence pairs and native audio from Tatoeba (CC-BY 2.0 FR).<br>
      To modify delivery time, timezone, or regional varieties, update your settings on the dashboard.</p>
    </div>
  </div>
</body>
</html>"""

    @staticmethod
    def _render_lesson_html_card(lesson: DailyLessonPayload, lang_title: str, badge_color: str) -> str:
        esc = html.escape
        regional = lesson.regional_variety.value
        cefr = lesson.cefr_level.value

        # Render vocabulary items (first 4 items for compact email)
        vocab_items_html = ""
        for v in lesson.section_2_vocabulary[:4]:
            audio_link = f' • <a href="{esc(v.audio_url)}" style="color: #0284c7; text-decoration: none;">🔊 Audio</a>' if v.audio_url else ""
            vocab_items_html += f"""
            <li class="vocab-item">
              <span class="vocab-lemma">{esc(v.lemma)}</span> <span style="font-size: 11px; color: #64748b;">({esc(v.part_of_speech)})</span>{audio_link}
              <div class="vocab-def">{esc(v.definition_en)}</div>
              <div class="vocab-ex">"{esc(v.example_sentence_target)}"</div>
            </li>"""

        # False friends alert
        ff_html = ""
        if lesson.false_friend_alerts:
            ff = lesson.false_friend_alerts[0]
            ff_html = f"""
            <div class="alert-box">
              ⚠️ <strong>False Friend Warning:</strong> "{esc(ff.portuguese_term)}" (PT) vs "{esc(ff.spanish_term)}" (ES)<br>
              {esc(ff.interference_warning)}
            </div>"""

        # Exercise sample with reveal
        ex_html = ""
        if lesson.section_9_exercises and lesson.section_10_answer_keys:
            ex = lesson.section_9_exercises[0]
            ans = lesson.section_10_answer_keys[0]
            ex_html = f"""
            <div class="exercise-box">
              <strong>Daily Challenge ({esc(ex.exercise_type)}):</strong>
              <div style="margin-top: 4px; font-size: 13px;">{esc(ex.prompt)}</div>
              {f'<div style="font-style: italic; margin-top: 4px; font-size: 13px;">{esc(ex.context_passage)}</div>' if ex.context_passage else ''}
              <details>
                <summary>Click to reveal answer & explanation</summary>
                <div class="answer-content">
                  <strong>Answer:</strong> {esc(', '.join(ans.acceptable_solutions))}<br>
                  <strong>Explanation:</strong> {esc(ans.explanation)}
                </div>
              </details>
            </div>"""

        return f"""
        <div class="track-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h2 class="track-title" style="color: {badge_color};">{esc(lang_title)}: {esc(lesson.curriculum_topic_title)}</h2>
            <span class="badge" style="background-color: {badge_color};">{esc(cefr)} • {esc(regional)}</span>
          </div>

          <div class="grammar-box">
            <strong>Grammar Focus:</strong> {esc(lesson.section_3_grammar.title)}<br>
            <div style="margin-top: 4px; font-size: 13px;">{esc(lesson.section_3_grammar.explanation_markdown.split('\\n')[0][:200])}</div>
            <div style="margin-top: 6px;"><span class="grammar-formula">{esc(lesson.section_3_grammar.structural_formula)}</span></div>
          </div>

          <h3 style="font-size: 14px; margin-bottom: 4px; color: #334155;">Key Lexical Items:</h3>
          <ul class="vocab-list">
            {vocab_items_html}
          </ul>

          {ff_html}
          {ex_html}
        </div>"""

    @staticmethod
    def _render_text(
        pt_lesson: Optional[DailyLessonPayload],
        es_lesson: Optional[DailyLessonPayload],
        recipient_name: str,
        today_str: str,
        streak_days: int,
        dashboard_url: str,
    ) -> str:
        lines = [
            "=" * 60,
            f"POLYGLOT C1 DAILY — {today_str.upper()}",
            f"Learner: {recipient_name} | Streak: {streak_days} days",
            "=" * 60,
            "",
        ]

        if pt_lesson:
            lines.extend([
                f"[PORTUGUÊS — CEFR {pt_lesson.cefr_level.value} ({pt_lesson.regional_variety.value})]",
                f"Topic: {pt_lesson.curriculum_topic_title}",
                f"Grammar: {pt_lesson.section_3_grammar.title}",
                f"Rule: {pt_lesson.section_3_grammar.explanation_markdown.split('\\n')[0][:200]}",
                f"Formula: {pt_lesson.section_3_grammar.structural_formula}",
                "",
                "Vocabulary:",
            ])
            for v in pt_lesson.section_2_vocabulary[:4]:
                lines.append(f"  * {v.lemma} ({v.part_of_speech}): {v.definition_en}")
                lines.append(f"    Example: \"{v.example_sentence_target}\"")
            if pt_lesson.false_friend_alerts:
                ff = pt_lesson.false_friend_alerts[0]
                lines.append(f"\n  [!] False Friend: {ff.portuguese_term} vs {ff.spanish_term} — {ff.interference_warning}")
            lines.append("")

        if es_lesson:
            lines.extend([
                f"[ESPAÑOL — CEFR {es_lesson.cefr_level.value} ({es_lesson.regional_variety.value})]",
                f"Topic: {es_lesson.curriculum_topic_title}",
                f"Grammar: {es_lesson.section_3_grammar.title}",
                f"Rule: {es_lesson.section_3_grammar.explanation_markdown.split('\\n')[0][:200]}",
                f"Formula: {es_lesson.section_3_grammar.structural_formula}",
                "",
                "Vocabulary:",
            ])
            for v in es_lesson.section_2_vocabulary[:4]:
                lines.append(f"  * {v.lemma} ({v.part_of_speech}): {v.definition_en}")
                lines.append(f"    Example: \"{v.example_sentence_target}\"")
            if es_lesson.false_friend_alerts:
                ff = es_lesson.false_friend_alerts[0]
                lines.append(f"\n  [!] False Friend: {ff.portuguese_term} vs {ff.spanish_term} — {ff.interference_warning}")
            lines.append("")

        lines.extend([
            "-" * 60,
            f"Interactive Dashboard & Audio: {dashboard_url}",
            "Licenses: Wiktionary CC-BY-SA 3.0 | Tatoeba CC-BY 2.0 FR",
            "=" * 60,
        ])

        return "\n".join(lines)
