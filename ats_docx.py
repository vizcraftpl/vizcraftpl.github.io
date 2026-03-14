import yaml
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

YAML_FILE = "./cv.yaml"
OUT_FILE = "./cv_output.docx"


def hr(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(1)
    p.paragraph_format.space_after = Pt(1)
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bot = OxmlElement("w:bottom")
    bot.set(qn("w:val"), "single")
    bot.set(qn("w:sz"), "6")
    bot.set(qn("w:space"), "1")
    bot.set(qn("w:color"), "AAAAAA")
    pBdr.append(bot)
    pPr.append(pBdr)


def font(run, name="Calibri", size=11, bold=False, italic=False, color=None):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    if color:
        run.font.color.rgb = RGBColor(*color)


def section_heading(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(1)
    r = p.add_run(text.upper())
    font(r, size=12, bold=True, color=(31, 73, 125))
    hr(doc)


def two_col_row(doc, left, right=""):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(1)
    r1 = p.add_run(left)
    font(r1, bold=True, size=11)
    if right:
        p.add_run("\t")
        r2 = p.add_run(right)
        font(r2, italic=True, size=10, color=(89, 89, 89))
    pPr = p._p.get_or_add_pPr()
    tabs = OxmlElement("w:tabs")
    tab = OxmlElement("w:tab")
    tab.set(qn("w:val"), "right")
    tab.set(qn("w:pos"), "9360")
    tabs.append(tab)
    pPr.append(tabs)


def subtitle(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(text)
    font(r, italic=True, size=10, color=(89, 89, 89))


def bullet(doc, text):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(text)
    font(r, size=10.5)


def plain(doc, text, size=10.5):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run(text)
    font(r, size=size)


def kv_line(doc, key, value):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    rk = p.add_run(f"{key}: ")
    font(rk, bold=True, size=10.5)
    rv = p.add_run(value)
    font(rv, size=10.5)



def render_header(doc, data):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(data["name"])
    font(r, size=22, bold=True)

    contact_parts = []
    c = data.get("contact", {})
    for field in ("phone", "email", "location", "website", "linkedin", "github"):
        if c.get(field):
            contact_parts.append(c[field])

    p2 = doc.add_paragraph(" | ".join(contact_parts))
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_after = Pt(6)
    for r in p2.runs:
        font(r, size=10)


def render_summary(doc, data):
    summary = data.get("professional_summary") or data.get("summary")
    if not summary:
        return
    section_heading(doc, "Professional Summary")
    plain(doc, summary.strip())


def render_skills(doc, data):
    skills = data.get("skills")
    if not skills:
        return
    section_heading(doc, "Skills")
    if isinstance(skills, dict):
        for category, items in skills.items():
            label = category.replace("_", " ").title()
            value = ", ".join(items) if isinstance(items, list) else str(items)
            kv_line(doc, label, value)
    elif isinstance(skills, list):
        for item in skills:
            kv_line(doc, item["category"], item["detail"])


def render_experience(doc, data):
    if not data.get("experience"):
        return
    section_heading(doc, "Experience")
    for job in data["experience"]:
        start = job.get("start_date", "")
        end = job.get("end_date", "")
        dates = f"{start} – {end}" if start or end else ""
        location = job.get("location", "")
        right_text = f"{location}  {dates}".strip()

        company = job.get("company", "")
        job_title = job.get("job_title", "")
        two_col_row(doc, company, right_text)

        if job_title:
            subtitle(doc, job_title)

        for point in job.get("responsibilities", []):
            bullet(doc, point)

        for role in job.get("roles", []):
            two_col_row(doc, role["title"], role.get("dates", ""))
            for point in role.get("bullets", []):
                bullet(doc, point)


def render_education(doc, data):
    items = data.get("education", [])
    if not items:
        return
    section_heading(doc, "Education")
    for edu in items:
        start = edu.get("start_date", "")
        end = edu.get("end_date", "")
        dates = f"{start} – {end}" if start or end else edu.get("dates", "")
        two_col_row(doc, edu.get("degree", ""), dates)

        inst_parts = [
            edu.get("institution", ""),
            edu.get("location", ""),
            edu.get("grade", ""),
        ]
        inst_line = "  |  ".join(p for p in inst_parts if p)
        if inst_line:
            subtitle(doc, inst_line)

        for detail in edu.get("details", []):
            bullet(doc, detail)


def render_certifications(doc, data):
    items = data.get("certifications") or data.get("awards_and_certifications", [])
    if not items:
        return
    section_heading(doc, "Certifications")
    for item in items:
        title = item.get("name") or item.get("title", "")
        date = str(item.get("date") or item.get("year", ""))
        issuer = item.get("issuer", "")
        two_col_row(doc, title, date)
        if issuer:
            subtitle(doc, issuer)


def render_projects(doc, data):
    items = data.get("projects", [])
    if not items:
        return
    section_heading(doc, "Projects")
    for proj in items:
        url = proj.get("url", "")
        two_col_row(doc, proj.get("name", ""), url)
        if proj.get("description"):
            plain(doc, proj["description"])
        techs = proj.get("technologies", [])
        if techs:
            kv_line(doc, "Technologies", ", ".join(techs))


def render_languages(doc, data):
    items = data.get("languages", [])
    if not items:
        return
    section_heading(doc, "Languages")
    for lang in items:
        kv_line(doc, lang.get("language", ""), lang.get("proficiency", ""))


def render_gdpr(doc, data):
    if not data.get("gdpr"):
        return
    section_heading(doc, "GDPR")
    plain(doc, data["gdpr"], size=9)


def build_cv(yaml_path: str, out_path: str):
    with open(yaml_path, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    doc = Document()

    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    render_header(doc, data)
    render_summary(doc, data)
    render_skills(doc, data)
    render_experience(doc, data)
    render_education(doc, data)
    render_certifications(doc, data)
    render_projects(doc, data)
    render_languages(doc, data)
    render_gdpr(doc, data)

    doc.save(out_path)
    print(f"✅  Saved → {out_path}")


build_cv(YAML_FILE, OUT_FILE)
