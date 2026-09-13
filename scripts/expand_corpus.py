"""
Expand the local Juriscore legal corpus toward full coverage.

Merges brain metadata + legal_db.sqlite judgments and writes additional
hand-curated constitution/statute content into api/backend/data/corpus/.
"""
from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path
from typing import Any, Dict, List

ROOT = Path(__file__).resolve().parents[1]
CORPUS = ROOT / "api" / "backend" / "data" / "corpus"
BRAIN = ROOT / "api" / "backend" / "data" / "brain" / "metadata"
LEGAL_DB = ROOT / "api" / "data" / "legal_db.sqlite"


def load_json(path: Path, default=None):
    if not path.exists():
        return default if default is not None else []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"wrote {path.name}: {len(data) if isinstance(data, list) else type(data)}")


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "item").lower()).strip("-")
    return s[:80] or "item"


# ── Constitution expansion (additional Bill of Rights + structure articles) ──
EXTRA_CONSTITUTION = [
    {"id": "cok-34", "article_num": 34, "chapter": "Chapter Two — Bill of Rights", "title": "Freedom of the media", "content": "Freedom and independence of electronic, print and all other types of media is guaranteed. The State shall not exercise control over or interfere with any person engaged in broadcasting, the production or circulation of any publication or the dissemination of information by any medium. Censorship of any form is prohibited."},
    {"id": "cok-36", "article_num": 36, "chapter": "Chapter Two — Bill of Rights", "title": "Freedom of association", "content": "Every person has the right to freedom of association, which includes the right to form, join or participate in the activities of an association of any kind. A person shall not be compelled to join an association of any kind."},
    {"id": "cok-37", "article_num": 37, "chapter": "Chapter Two — Bill of Rights", "title": "Assembly, demonstration, picketing and petition", "content": "Every person has the right, peaceably and unarmed, to assemble, to demonstrate, to picket, and to present petitions to public authorities."},
    {"id": "cok-38", "article_num": 38, "chapter": "Chapter Two — Bill of Rights", "title": "Political rights", "content": "Every citizen is free to make political choices, which includes the right to form, or participate in forming, a political party; to participate in the activities of, or recruit members for, a political party; or to campaign for a political party or cause. Every citizen is free to free and fair elections for any elective public body or office established under this Constitution."},
    {"id": "cok-39", "article_num": 39, "chapter": "Chapter Two — Bill of Rights", "title": "Freedom of movement and residence", "content": "Every person has the right to freedom of movement. Every citizen has the right to enter, remain in and reside anywhere in Kenya. Every citizen has the right to a Kenyan passport and to leave and re-enter Kenya."},
    {"id": "cok-41", "article_num": 41, "chapter": "Chapter Two — Bill of Rights", "title": "Fair labour practices", "content": "Every person has the right to fair labour practices. Every worker has the right to fair remuneration; to reasonable working conditions; to form, join or participate in the activities and programmes of a trade union; and to go on strike."},
    {"id": "cok-42", "article_num": 42, "chapter": "Chapter Two — Bill of Rights", "title": "Clean and healthy environment", "content": "Every person has the right to a clean and healthy environment, which includes the right to have the environment protected for the benefit of present and future generations through legislative and other measures."},
    {"id": "cok-44", "article_num": 44, "chapter": "Chapter Two — Bill of Rights", "title": "Language and culture", "content": "Every person has the right to use the language, and to participate in the cultural life, of the person's choice. A person belonging to a cultural or linguistic community has the right, with other members of that community, to use the language, or to practise the culture."},
    {"id": "cok-45", "article_num": 45, "chapter": "Chapter Two — Bill of Rights", "title": "Family", "content": "The family is the natural and fundamental unit of society and the necessary basis of social order, and shall enjoy the recognition and protection of the State. Parliament shall enact legislation to recognise marriages concluded under any tradition, or system of religious, personal or family law."},
    {"id": "cok-46", "article_num": 46, "chapter": "Chapter Two — Bill of Rights", "title": "Consumer rights", "content": "Every person has the right to goods and services of reasonable quality. The rights of consumers include the right to information necessary for them to gain full benefit from goods and services; to the protection of their health, safety, and economic interests; and to compensation for loss or injury arising from defects in goods or services."},
    {"id": "cok-53", "article_num": 53, "chapter": "Chapter Two — Bill of Rights", "title": "Rights of children", "content": "Every child has the right to free and compulsory basic education; to parental care and protection; not to be subjected to any form of abuse, neglect or exploitation; not to be detained except as a measure of last resort; and to protection from economic exploitation."},
    {"id": "cok-54", "article_num": 54, "chapter": "Chapter Two — Bill of Rights", "title": "Rights of persons with disabilities", "content": "A person with any disability is entitled to be treated with dignity and respect; to access educational institutions; to reasonable access to all places, public transport and information; and to use Sign language, Braille or other appropriate means of communication."},
    {"id": "cok-55", "article_num": 55, "chapter": "Chapter Two — Bill of Rights", "title": "Youth", "content": "The State shall take measures, including affirmative action programmes, to ensure that the youth access relevant education and training; have opportunities to associate, be represented and participate in political, social, economic and other spheres of life; and access employment."},
    {"id": "cok-56", "article_num": 56, "chapter": "Chapter Two — Bill of Rights", "title": "Minorities and marginalised groups", "content": "The State shall put in place affirmative action programmes designed to ensure that minorities and marginalised groups provide special opportunities in education and economic fields; shall develop the language of minorities; and shall include them in the organs of state."},
    {"id": "cok-57", "article_num": 57, "chapter": "Chapter Two — Bill of Rights", "title": "Rights of arrested, detained and accused persons", "content": "Supplements Articles 49–51 with guarantees on humane treatment, legal representation, and trial within a reasonable time."},
    {"id": "cok-73", "article_num": 73, "chapter": "Chapter Six — Leadership and Integrity", "title": "Principles of leadership and integrity", "content": "Authority assigned to a State officer is a public trust to be exercised in a manner consistent with the purposes of this Constitution; demonstrates respect for the people; brings honour to the nation and dignity to the office; and promotes public confidence in the integrity of the office."},
    {"id": "cok-80", "article_num": 80, "chapter": "Chapter Six — Leadership and Integrity", "title": "Legislation on leadership", "content": "Parliament shall enact legislation to give effect to this Chapter, and provide for the administration, implementation and enforcement of this Chapter; the continuous functioning of the code of ethics; and the investigation and prosecution of breaches of this Chapter."},
    {"id": "cok-81", "article_num": 81, "chapter": "Chapter Seven — Representation of the People", "title": "General principles for the electoral system", "content": "The electoral system shall comply with principles of freedom and freedom from violence; an independent body; transparency; and impartial administration. Not more than two-thirds of the members of elective public bodies shall be of the same gender."},
    {"id": "cok-95", "article_num": 95, "chapter": "Chapter Eight — Legislature", "title": "Role of Parliament", "content": "Parliament shall enact legislation; determine the allocation of national revenue; appropriate funds; and review the conduct in office of the President, Deputy President and other State officers."},
    {"id": "cok-118", "article_num": 118, "chapter": "Chapter Eight — Legislature", "title": "Public access and participation", "content": "Parliament shall conduct its business in an open manner, and its sittings and those of its committees shall be open to the public; facilitate public participation and involvement in legislative and other business of Parliament and its committees."},
    {"id": "cok-124", "article_num": 124, "chapter": "Chapter Eight — Legislature", "title": "Powers, privileges and immunities", "content": "There shall be freedom of speech and debate in Parliament. Parliament may, for the purpose of the orderly and effective discharge of its business, regulate its procedure and business."},
    {"id": "cok-131", "article_num": 131, "chapter": "Chapter Nine — Executive", "title": "Authority of the President", "content": "The President is the Head of State and Government; exercises the executive authority of the Republic; is the Commander-in-Chief of the Kenya Defence Forces; and is a symbol of national unity."},
    {"id": "cok-147", "article_num": 147, "chapter": "Chapter Nine — Executive", "title": "Functions of the Deputy President", "content": "The Deputy President shall be the principal assistant of the President; deputise for the President; and perform functions of the President as may be assigned by the President."},
    {"id": "cok-161", "article_num": 161, "chapter": "Chapter Ten — Judiciary", "title": "Structure of Judiciary", "content": "The Judiciary consists of the Chief Justice, the judges and other officers of the superior courts; and magistrates, other judicial officers and staff employed or engaged for the administration of justice in the subordinate courts."},
    {"id": "cok-169", "article_num": 169, "chapter": "Chapter Ten — Judiciary", "title": "Subordinate courts", "content": "Subordinate courts are the High Court; the Environment and Land Court; the Employment and Labour Relations Court; and the subordinate courts including magistrates courts, courts martial, Kadhis' courts and other specialised courts established by Parliament."},
    {"id": "cok-174", "article_num": 174, "chapter": "Chapter Eleven — Devolved Government", "title": "Objects of devolution", "content": "Devolution shall promote democratic and accountable exercise of power; foster national unity; recognise the right of communities to manage their own affairs; protect and promote the interests and rights of minorities and marginalised communities; and ensure equitable sharing of national and local resources."},
    {"id": "cok-176", "article_num": 176, "chapter": "Chapter Eleven — Devolved Government", "title": "County governments", "content": "There shall be a county government for each county, consisting of a county assembly and a county executive."},
    {"id": "cok-185", "article_num": 185, "chapter": "Chapter Eleven — Devolved Government", "title": "Legislative authority of county assemblies", "content": "The legislative authority of a county is vested in, and exercised by, its county assembly. A county assembly may make any laws that are necessary for, or incidental to, the effective performance of the functions and exercise of the powers of the county government."},
    {"id": "cok-189", "article_num": 189, "chapter": "Chapter Eleven — Devolved Government", "title": "Cooperation between national and county governments", "content": "The national government and county governments shall perform their functions, and exercise their powers, in a manner that respects the functional and institutional integrity of each other, and co-operate in the performance of functions and exercise of powers."},
    {"id": "cok-205", "article_num": 205, "chapter": "Chapter Twelve — Public Finance", "title": "Financial reports of national government", "content": "At least every six months, the national government shall submit a report on the implementation of the budgets of the national government to the relevant county assemblies and the Senate."},
    {"id": "cok-217", "article_num": 217, "chapter": "Chapter Twelve — Public Finance", "title": "Equitable share", "content": "Once every five years, the Senate shall, by resolution, determine the basis of allocating among the counties the share of national revenue that is annually allocated to the county level of government."},
    {"id": "cok-227", "article_num": 227, "chapter": "Chapter Twelve — Public Finance", "title": "Procurement of public goods and services", "content": "When a State organ or any other public entity contracts for goods or services, it shall do so in accordance with a system that is fair, equitable, transparent, competitive and cost-effective."},
    {"id": "cok-238", "article_num": 238, "chapter": "Chapter Fourteen — National Security", "title": "Principles of national security", "content": "National security shall be pursued in compliance with the law and with the utmost respect for the rule of law, democracy, human rights and fundamental freedoms."},
    {"id": "cok-244", "article_num": 244, "chapter": "Chapter Fourteen — National Security", "title": "Objects of security organs", "content": "The national security organs shall respect and promote human rights and fundamental freedoms; and comply with democratic standards of civilian oversight."},
    {"id": "cok-248", "article_num": 248, "chapter": "Chapter Fifteen — Commissions", "title": "Commissions and independent offices", "content": "The commissions and independent offices are the Kenya National Human Rights and Equality Commission; the National Land Commission; the Independent Electoral and Boundaries Commission; the Parliamentary Service Commission; the Judicial Service Commission; the Commission on Revenue Allocation; the Public Service Commission; the Salaries and Remuneration Commission; the Teachers Service Commission; and the National Police Service Commission."},
    {"id": "cok-252", "article_num": 252, "chapter": "Chapter Fifteen — Commissions", "title": "Independence of commissions", "content": "A commission or independent office is not subject to direction or control by any person or authority. Parliament shall allocate adequate funds to enable each commission and independent office to perform its functions."},
    {"id": "cok-259", "article_num": 259, "chapter": "Chapter Sixteen — Amendment of Constitution", "title": "Construction of this Constitution", "content": "This Constitution shall be interpreted in a manner that promotes its purposes, values and principles; advances the rule of law, and the human rights and fundamental freedoms in the Bill of Rights; permits the development of the law; and contributes to good governance."},
    {"id": "cok-260", "article_num": 260, "chapter": "Chapter Sixteen — Amendment of Constitution", "title": "Definitions", "content": "Defines key terms including 'citizen', 'legislation', 'land', 'public officer', 'State', 'State officer', and related constitutional vocabulary used throughout the Constitution."},
    {"id": "cok-261", "article_num": 261, "chapter": "Chapter Sixteen — Amendment of Constitution", "title": "Transitional and consequential legislation", "content": "Parliament shall enact any legislation required by this Constitution within the period specified in the Fifth Schedule; and enact any legislation that may be necessary consequent upon the enactment of this Constitution."},
]


EXTRA_STATUTES = [
    {
        "id": "stat-income-tax",
        "title": "Income Tax Act",
        "citation": "Cap. 470",
        "cap_number": "470",
        "year": 1974,
        "summary": "Principal statute imposing tax on income of persons resident and non-resident in Kenya.",
        "full_text": "The Income Tax Act (Cap. 470) charges tax on income of every person for each year of income.\n\nResident individuals are taxed on worldwide income. Non-residents are taxed on income sourced in Kenya.\n\nCharge of tax: There shall be charged for each year of income tax upon income of every person for each year of income.\n\nDeductions: Outgoings and expenses wholly and exclusively incurred in the production of income are deductible subject to statutory limits.\n\nWithholding tax: Specific payments to non-residents and specified resident persons attract withholding tax at prescribed rates.\n\nCapital allowances: Wear and tear and industrial building deductions are available for qualifying assets.\n\nTransfer pricing: Transactions with associated enterprises must meet the arm's length principle.",
        "sections": [
            {"number": "3", "heading": "Charge of tax", "text": "There shall be charged for each year of income tax upon the income of every person for each year of income."},
            {"number": "15", "heading": "Deductions", "text": "For the purpose of ascertaining the gains or profits, there shall be deducted all outgoings and expenses wholly and exclusively incurred in the production of that income."},
            {"number": "35", "heading": "Withholding tax", "text": "A resident person making a payment to a non-resident person shall deduct tax at the prescribed rate and remit to the Commissioner."},
        ],
    },
    {
        "id": "stat-vat",
        "title": "Value Added Tax Act",
        "citation": "No. 35 of 2013",
        "cap_number": "476",
        "year": 2013,
        "summary": "Imposes VAT on taxable supplies of goods and services in Kenya.",
        "full_text": "The VAT Act 2013 provides for the imposition of value added tax on taxable supplies, imports, and related matters.\n\nStandard rate of VAT applies to taxable supplies unless exempt or zero-rated.\n\nA registered person making taxable supplies must account for output tax and may claim input tax subject to documentary requirements.\n\nThe Cabinet Secretary may by order amend the schedules of exempt and zero-rated goods with parliamentary approval.\n\nOffences include failure to register, false returns, and failure to issue tax invoices.",
        "sections": [
            {"number": "5", "heading": "VAT on taxable supplies", "text": "VAT shall be charged on any taxable supply of goods or services made in Kenya by a registered person in the course of business."},
            {"number": "13", "heading": "Registration", "text": "A person who makes taxable supplies exceeding the registration threshold shall apply for registration."},
        ],
    },
    {
        "id": "stat-children",
        "title": "Children Act",
        "citation": "No. 29 of 2022",
        "cap_number": None,
        "year": 2022,
        "summary": "Consolidates and reformulates law relating to children in Kenya, including care, protection and justice.",
        "full_text": "The Children Act 2022 gives effect to Article 53 of the Constitution and the Convention on the Rights of the Child.\n\nBest interests of the child shall be the primary consideration in all actions concerning children.\n\nThe Act covers parental responsibility, foster care, adoption, child justice, and protection from abuse, exploitation and harmful practices.\n\nDetention of children shall be a measure of last resort and for the shortest appropriate period.",
        "sections": [
            {"number": "4", "heading": "Best interests of the child", "text": "In all actions concerning children, the best interests of the child shall be the primary consideration."},
            {"number": "8", "heading": "Right to education", "text": "Every child has the right to free and compulsory basic education."},
        ],
    },
    {
        "id": "stat-faa",
        "title": "Fair Administrative Action Act",
        "citation": "No. 4 of 2015",
        "cap_number": None,
        "year": 2015,
        "summary": "Gives effect to Article 47 on fair administrative action and procedural fairness.",
        "full_text": "The Fair Administrative Action Act operationalises Article 47 of the Constitution.\n\nEvery person has the right to administrative action that is expeditious, efficient, lawful, reasonable and procedurally fair.\n\nWhere a right is adversely affected, the person is entitled to written reasons for the decision.\n\nAdministrative bodies must give prior notice, opportunity to make representations, and notice of appeal or review rights.\n\nThe High Court may review administrative action on grounds of illegality, irrationality, procedural impropriety, and breach of legitimate expectation.",
        "sections": [
            {"number": "4", "heading": "Administrative action to be expeditious, efficient, lawful", "text": "Every person has the right to administrative action which is expeditious, efficient, lawful, reasonable and procedurally fair."},
            {"number": "6", "heading": "Prior notice", "text": "A person likely to be adversely affected by an administrative decision is entitled to prior notice of the proposed decision and reasons for it."},
            {"number": "7", "heading": "Written reasons", "text": "Where an administrative action is likely to adversely affect rights, the administrator shall give written reasons for the action."},
        ],
    },
    {
        "id": "stat-competition",
        "title": "Competition Act",
        "citation": "No. 12 of 2010",
        "cap_number": None,
        "year": 2010,
        "summary": "Promotes and protects competition in Kenyan markets; regulates mergers and consumer protection.",
        "full_text": "The Competition Act prohibits anti-competitive agreements and abuse of dominant position; provides for merger control; and protects consumers against unfair practices.\n\nThe Competition Authority of Kenya investigates and adjudicates competition offences.\n\nExclusionary abuses include predatory pricing, refusal to deal, and tied selling where the effect is to substantially prevent or lessen competition.\n\nMergers require prior notification and approval where thresholds are met.",
        "sections": [
            {"number": "21", "heading": "Restrictive trade practices", "text": "An agreement between undertakings is prohibited if its object or effect is the prevention, restriction or distortion of competition."},
            {"number": "24", "heading": "Abuse of dominant position", "text": "An undertaking which holds a dominant position in a market is prohibited from abusing that position."},
        ],
    },
    {
        "id": "stat-insurance",
        "title": "Insurance Act",
        "citation": "Cap. 487",
        "cap_number": "487",
        "year": 1984,
        "summary": "Regulates insurance business, licensing of insurers and intermediaries in Kenya.",
        "full_text": "The Insurance Act regulates the carrying on of insurance business in Kenya. Insurers must be licensed by the Insurance Regulatory Authority. The Act covers long-term and general insurance business, professional indemnity, and policyholder protection.",
        "sections": [],
    },
    {
        "id": "stat-banking",
        "title": "Banking Act",
        "citation": "Cap. 488",
        "cap_number": "488",
        "year": 1989,
        "summary": "Licensing and regulation of financial institutions by the Central Bank of Kenya.",
        "full_text": "The Banking Act requires institutions taking deposits to be licensed by the Central Bank. It covers capital requirements, liquidity, lending limits, confidentiality of customer information, and resolution of troubled institutions.",
        "sections": [
            {"number": "31", "heading": "Restriction on disclosure of customer information", "text": "No person shall disclose customer account information except as required by law or with customer consent."},
        ],
    },
    {
        "id": "stat-women-property",
        "title": "Married Women Property Act",
        "citation": "Cap. 160A",
        "cap_number": "160A",
        "year": 1882,
        "summary": "Historical statute on married women's property, read with Matrimonial Property Act and Constitution.",
        "full_text": "Read with the Constitution (Articles 27, 40, 45) and Matrimonial Property Act 2013, this Act historically enabled married women to hold property in their own name. Modern disputes turn on contribution (monetary and non-monetary) to acquisition of matrimonial property.",
        "sections": [],
    },
    {
        "id": "stat-land-registration",
        "title": "Land Registration Act",
        "citation": "No. 3 of 2012",
        "cap_number": None,
        "year": 2012,
        "summary": "Governs registration of interests in land, titles, caveats and land registries.",
        "full_text": "The Land Registration Act 2012 provides for the registration of title to land and interests in land. Registration confers indefeasibility subject to fraud, overriding interests and statutory exceptions. The Act covers transfers, leases, charges, caveats and rectification of the register.",
        "sections": [
            {"number": "26", "heading": "Registration as conclusive evidence of proprietorship", "text": "The certificate of title issued upon registration shall be taken by all courts as prima facie evidence that the person named is the proprietor."},
        ],
    },
    {
        "id": "stat-national-land",
        "title": "National Land Commission Act",
        "citation": "No. 5 of 2012",
        "cap_number": None,
        "year": 2012,
        "summary": "Establishes the National Land Commission and its functions under Article 67.",
        "full_text": "The National Land Commission Act gives effect to Article 67. The Commission manages public land on behalf of the national and county governments; recommends a national land policy; investigates and resolves historical land injustices; and recommends a fair process for compulsory acquisition.",
        "sections": [],
    },
    {
        "id": "stat-counties",
        "title": "County Governments Act",
        "citation": "No. 17 of 2012",
        "cap_number": None,
        "year": 2012,
        "summary": "Provides for county government functions, intergovernmental relations and county assemblies.",
        "full_text": "The County Governments Act elaborates on Chapter Eleven of the Constitution. It covers county executive and assembly functions, public participation, county planning, and intergovernmental dispute resolution.",
        "sections": [],
    },
    {
        "id": "stat-public-participation",
        "title": "Public Participation and Access to Information",
        "citation": "Linked to Articles 10, 118, 196, 232",
        "cap_number": None,
        "year": 2010,
        "summary": "Constitutional baseline for public participation in legislative and policy processes.",
        "full_text": "Kenyan courts have developed a substantial jurisprudence requiring meaningful public participation before enactment of legislation and county laws. Requirements include timely notice, accessible information, opportunity to make submissions, and consideration of views received. Failure to involve the public may invalidate the enactment.",
        "sections": [],
    },
]


def merge_constitution():
    existing = load_json(CORPUS / "constitution.json", [])
    have = {a.get("id") for a in existing}
    added = 0
    for a in EXTRA_CONSTITUTION:
        if a["id"] not in have:
            existing.append(a)
            have.add(a["id"])
            added += 1
    existing.sort(key=lambda x: (x.get("article_num") or 0))
    save_json(CORPUS / "constitution.json", existing)
    print(f"  constitution +{added} -> {len(existing)}")


def merge_statutes():
    existing = load_json(CORPUS / "statutes.json", [])
    have = {s.get("id") for s in existing}
    added = 0
    for s in EXTRA_STATUTES:
        if s["id"] not in have:
            existing.append(s)
            have.add(s["id"])
            added += 1
    # merge brain legislation titles into statutes if not already present
    brain_leg = load_json(BRAIN / "legislation.json", [])
    for item in brain_leg:
        title = item.get("title") or ""
        sid = "stat-brain-" + slugify(title)
        if sid in have or not title:
            continue
        existing.append({
            "id": sid,
            "title": title,
            "citation": item.get("citation") or "",
            "cap_number": (item.get("cap_number") or "").replace("Cap. ", "").strip() or None,
            "year": item.get("year"),
            "summary": item.get("excerpt") or "",
            "full_text": item.get("excerpt") or "",
            "sections": [],
            "source": "brain_metadata",
            "chapters": item.get("chapters") or [],
        })
        have.add(sid)
        added += 1
    save_json(CORPUS / "statutes.json", existing)
    print(f"  statutes +{added} -> {len(existing)}")


def merge_brain_cases():
    existing = load_json(CORPUS / "cases.json", [])
    have = {c.get("id") for c in existing}
    titles = {c.get("title") for c in existing}
    brain = load_json(BRAIN / "cases.json", [])
    added = 0
    for item in brain:
        title = item.get("title") or ""
        if not title or title in titles:
            continue
        cid = "case-brain-" + slugify(title)
        if cid in have:
            continue
        existing.append({
            "id": cid,
            "title": title,
            "citation": item.get("citation") or "",
            "court": item.get("court") or "",
            "year": item.get("year"),
            "date": None,
            "judge": None,
            "topics": item.get("topics") or [],
            "summary": {
                "facts": item.get("excerpt") or "",
                "issues": [],
                "holding": item.get("excerpt") or "",
                "ratio": "",
                "obiter": "",
            },
            "full_text": item.get("excerpt") or "",
            "url": item.get("url"),
            "source": "brain_metadata",
        })
        titles.add(title)
        have.add(cid)
        added += 1
    save_json(CORPUS / "cases.json", existing)
    print(f"  cases +{added} -> {len(existing)}")


def merge_brain_gazettes():
    existing = load_json(CORPUS / "gazettes.json", [])
    have = {g.get("id") for g in existing}
    brain = load_json(BRAIN / "gazettes.json", [])
    added = 0
    for i, item in enumerate(brain):
        title = item.get("title") or f"Gazette item {i+1}"
        gid = "gz-brain-" + slugify(title)
        if gid in have:
            continue
        existing.append({
            "id": gid,
            "title": title,
            "gazette_number": item.get("citation") or item.get("gazette_number") or "",
            "date": item.get("date") or item.get("year") or "",
            "category": item.get("category") or item.get("type") or "Notice",
            "county": item.get("county") or "Nairobi",
            "type": item.get("type") or "Notice",
            "author": item.get("author") or "Kenya Gazette",
            "summary": item.get("excerpt") or item.get("summary") or "",
            "pages": item.get("pages") or 1,
            "status": "published",
            "source": "brain_metadata",
        })
        have.add(gid)
        added += 1
    save_json(CORPUS / "gazettes.json", existing)
    print(f"  gazettes +{added} -> {len(existing)}")


def export_legal_db_cases(limit: int | None = None):
    """Export legal_db judgments into a large cases catalog file used by corpus loader."""
    if not LEGAL_DB.exists():
        print("legal_db.sqlite missing — skip")
        return
    conn = sqlite3.connect(str(LEGAL_DB))
    conn.row_factory = sqlite3.Row
    sql = "SELECT id, doc_type, title, citation, court, year, topics, excerpt, url, date FROM documents"
    if limit:
        sql += f" LIMIT {int(limit)}"
    rows = conn.execute(sql).fetchall()
    conn.close()
    out = []
    for r in rows:
        topics = r["topics"] or ""
        if isinstance(topics, str):
            topic_list = [t.strip() for t in topics.split(",") if t.strip()]
        else:
            topic_list = topics or []
        out.append({
            "id": f"ldb-{r['id']}",
            "title": (r["title"] or "").replace("\xa0", " ").strip(),
            "citation": (r["citation"] or "").replace("\xa0", " ").strip(),
            "court": r["court"] or "",
            "year": int(r["year"]) if r["year"] else None,
            "date": r["date"],
            "doc_type": r["doc_type"] or "judgment",
            "topics": topic_list,
            "summary": {"facts": r["excerpt"] or "", "issues": [], "holding": r["excerpt"] or "", "ratio": "", "obiter": ""},
            "full_text": r["excerpt"] or "",
            "url": r["url"],
            "source": "legal_db",
        })
    save_json(CORPUS / "cases_full.json", out)
    print(f"  cases_full -> {len(out)}")


def merge_brain_articles_bills():
    # map articles + bills into publications / parliament
    pubs = load_json(CORPUS / "publications.json", [])
    have_p = {p.get("id") for p in pubs}
    for i, item in enumerate(load_json(BRAIN / "articles.json", [])):
        title = item.get("title") or f"Article {i+1}"
        pid = "pub-brain-" + slugify(title)
        if pid in have_p:
            continue
        pubs.append({
            "id": pid,
            "title": title,
            "publisher": item.get("publisher") or item.get("author") or "Legal scholarship",
            "year": item.get("year"),
            "category": "Article",
            "summary": item.get("excerpt") or "",
            "frequency": "Article",
            "source": "brain_metadata",
        })
        have_p.add(pid)
    save_json(CORPUS / "publications.json", pubs)

    par = load_json(CORPUS / "parliament.json", [])
    have_par = {p.get("id") for p in par}
    for item in load_json(BRAIN / "bills.json", []):
        title = item.get("title") or ""
        if not title:
            continue
        bid = "par-brain-" + slugify(title)
        if bid in have_par:
            continue
        par.append({
            "id": bid,
            "title": title,
            "house": item.get("house") or "National Assembly",
            "status": item.get("status") or item.get("stage") or "Tracked",
            "sponsor": item.get("sponsor") or "",
            "summary": item.get("excerpt") or "",
            "date": item.get("date") or item.get("year"),
            "topics": item.get("topics") or [],
            "source": "brain_metadata",
        })
        have_par.add(bid)
    save_json(CORPUS / "parliament.json", par)
    print(f"  publications={len(pubs)} parliament={len(par)}")


def main():
    print("Expanding Juriscore local corpus...")
    merge_constitution()
    merge_statutes()
    merge_brain_cases()
    merge_brain_gazettes()
    merge_brain_articles_bills()
    export_legal_db_cases()
    # final counts
    total = 0
    for f in sorted(CORPUS.glob("*.json")):
        data = load_json(f, [])
        n = len(data) if isinstance(data, list) else 0
        total += n
        print(f"  {f.name}: {n}")
    print(f"CORPUS TOTAL: {total}")


if __name__ == "__main__":
    main()
