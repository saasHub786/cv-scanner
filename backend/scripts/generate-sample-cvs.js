/**
 * Sample CV Generator
 * Creates 5 realistic CV PDFs for testing
 * Run: node scripts/generate-sample-cvs.js
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'sample-cvs');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const candidates = [
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    linkedin: 'linkedin.com/in/sarahjohnson',
    title: 'Senior Full Stack Developer',
    summary: 'Senior Full Stack Developer with 7+ years of experience building scalable web applications. Proficient in React, Node.js, TypeScript, and cloud technologies. Passionate about clean code and mentoring junior developers.',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Next.js', 'Express', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'REST APIs', 'GraphQL', 'Redis', 'CI/CD'],
    experience: [
      {
        role: 'Senior Full Stack Developer',
        company: 'TechCorp Inc.',
        period: '2021 - Present',
        highlights: [
          'Led development of microservices architecture serving 2M+ users',
          'Reduced API response time by 60% through query optimization',
          'Mentored 4 junior developers through code reviews and pair programming',
          'Implemented CI/CD pipeline reducing deployment time by 80%'
        ]
      },
      {
        role: 'Full Stack Developer',
        company: 'WebSolutions Co.',
        period: '2018 - 2021',
        highlights: [
          'Built React-based dashboard used by 500+ enterprise clients',
          'Designed and implemented RESTful APIs using Node.js and Express',
          'Integrated third-party payment gateways (Stripe, PayPal)',
          'Migrated legacy codebase from PHP to Node.js'
        ]
      },
      {
        role: 'Junior Developer',
        company: 'StartupXYZ',
        period: '2016 - 2018',
        highlights: [
          'Developed responsive frontend components using React',
          'Built automated testing suite achieving 90% code coverage',
          'Collaborated on database schema design and optimization'
        ]
      }
    ],
    education: 'M.S. Computer Science, Stanford University (2016)\nB.S. Computer Science, UCLA (2014)',
    certifications: ['AWS Certified Developer', 'Meta Front-End Developer']
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 234-5678',
    linkedin: 'linkedin.com/in/michaelchen',
    title: 'DevOps Engineer / Cloud Architect',
    summary: 'DevOps Engineer with 6+ years of experience in cloud infrastructure, CI/CD, and automation. Expertise in AWS, Kubernetes, Docker, and infrastructure as code. Focused on building resilient and scalable systems.',
    skills: ['AWS', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'GitHub Actions', 'Linux', 'Python', 'Bash', 'Prometheus', 'Grafana', 'ELK Stack', 'Nginx'],
    experience: [
      {
        role: 'DevOps Engineer',
        company: 'CloudScale Inc.',
        period: '2020 - Present',
        highlights: [
          'Architected multi-region AWS infrastructure serving 10M+ daily requests',
          'Reduced infrastructure costs by 40% through reserved instances and auto-scaling',
          'Implemented Kubernetes cluster management for 50+ microservices',
          'Built comprehensive monitoring stack with Prometheus and Grafana'
        ]
      },
      {
        role: 'Systems Engineer',
        company: 'DataFlow Corp.',
        period: '2018 - 2020',
        highlights: [
          'Automated deployment pipeline reducing release time from 2 days to 30 minutes',
          'Managed migration of on-premise infrastructure to AWS cloud',
          'Implemented Infrastructure as Code using Terraform and Ansible'
        ]
      }
    ],
    education: 'B.S. Computer Engineering, MIT (2018)',
    certifications: ['AWS Solutions Architect Professional', 'CKA (Certified Kubernetes Administrator)', 'HashiCorp Terraform Associate']
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '+1 (555) 345-6789',
    linkedin: 'linkedin.com/in/emilyrodriguez',
    title: 'Digital Marketing Manager',
    summary: 'Results-driven Digital Marketing Manager with 5+ years of experience in B2B SaaS marketing. Expertise in SEO, content marketing, paid advertising, and marketing automation. Track record of generating 3x ROI on marketing campaigns.',
    skills: ['SEO/SEM', 'Google Analytics', 'HubSpot', 'Marketo', 'Salesforce', 'Content Strategy', 'Social Media Marketing', 'Email Marketing', 'A/B Testing', 'Google Ads', 'LinkedIn Ads', 'Canva', 'Figma', 'WordPress', 'SQL'],
    experience: [
      {
        role: 'Digital Marketing Manager',
        company: 'SaaSBoost Inc.',
        period: '2021 - Present',
        highlights: [
          'Increased organic traffic by 200% through SEO strategy overhaul',
          'Managed $2M annual advertising budget across Google, LinkedIn, and Meta',
          'Reduced customer acquisition cost by 35% through campaign optimization',
          'Led content team producing 50+ pieces of content monthly'
        ]
      },
      {
        role: 'Marketing Specialist',
        company: 'GrowthHackers Agency',
        period: '2019 - 2021',
        highlights: [
          'Developed email marketing campaigns with 45% open rate (industry avg: 22%)',
          'Managed social media presence growing followers from 5K to 50K',
          'Created marketing automation workflows in HubSpot and Marketo'
        ]
      }
    ],
    education: 'B.S. Marketing, University of Michigan (2019)\nCertificate in Data Analytics, Coursera/Google (2020)',
    certifications: ['HubSpot Marketing Hub Certified', 'Google Analytics Individual Qualification']
  },
  {
    name: 'David Thompson',
    email: 'david.thompson@email.com',
    phone: '+1 (555) 456-7890',
    linkedin: 'linkedin.com/in/davidthompson',
    title: 'Data Scientist / ML Engineer',
    summary: 'Data Scientist with 4+ years of experience in machine learning, statistical analysis, and data engineering. Proficient in Python, R, and cloud-based ML pipelines. Passionate about turning data into actionable business insights.',
    skills: ['Python', 'R', 'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy', 'SQL', 'Tableau', 'Power BI', 'Apache Spark', 'Airflow', 'AWS SageMaker', 'Docker', 'Git'],
    experience: [
      {
        role: 'Data Scientist',
        company: 'AIData Corp.',
        period: '2022 - Present',
        highlights: [
          'Developed ML models predicting customer churn with 94% accuracy',
          'Built real-time recommendation system serving 500K+ users',
          'Created automated data pipeline reducing processing time by 70%',
          'Presented data insights to C-suite driving strategic decisions'
        ]
      },
      {
        role: 'Junior Data Scientist',
        company: 'InsightLab',
        period: '2020 - 2022',
        highlights: [
          'Designed A/B testing framework for product features',
          'Built interactive dashboards in Tableau for stakeholder reporting',
          'Implemented NLP models for sentiment analysis on customer feedback'
        ]
      }
    ],
    education: 'M.S. Data Science, UC Berkeley (2020)\nB.S. Statistics, University of Washington (2018)',
    certifications: ['TensorFlow Developer Certificate', 'AWS Certified Machine Learning']
  },
  {
    name: 'Jessica Patel',
    email: 'jessica.patel@email.com',
    phone: '+1 (555) 567-8901',
    linkedin: 'linkedin.com/in/jessicapatel',
    title: 'Product Manager',
    summary: 'Product Manager with 6+ years of experience leading cross-functional teams to deliver SaaS products. Skilled in user research, product strategy, agile methodology, and data-driven decision making. Launched 3 successful products from ideation to scale.',
    skills: ['Product Strategy', 'User Research', 'A/B Testing', 'Agile/Scrum', 'JIRA', 'Confluence', 'Figma', 'Mixpanel', 'Amplitude', 'SQL', 'Roadmapping', 'Stakeholder Management', 'API Design', 'Market Analysis'],
    experience: [
      {
        role: 'Senior Product Manager',
        company: 'ProductLabs Inc.',
        period: '2021 - Present',
        highlights: [
          'Led product launch achieving 50K users in first 3 months',
          'Increased user retention by 25% through feature improvements',
          'Managed roadmap and prioritized features for 3 engineering teams',
          'Conducted 100+ user interviews driving product-market fit'
        ]
      },
      {
        role: 'Product Manager',
        company: 'AppVentures Co.',
        period: '2019 - 2021',
        highlights: [
          'Defined product requirements for B2B platform generating $5M ARR',
          'Reduced time-to-market by 30% through improved agile processes',
          'Collaborated with engineering to ship 20+ major features on schedule'
        ]
      },
      {
        role: 'Associate Product Manager',
        company: 'TechStart',
        period: '2017 - 2019',
        highlights: [
          'Analyzed user behavior data to inform product decisions',
          'Coordinated beta testing program with 500+ participants',
          'Wrote product specs and acceptance criteria for development team'
        ]
      }
    ],
    education: 'MBA, Harvard Business School (2017)\nB.S. Computer Science, Georgia Tech (2015)',
    certifications: ['Certified Scrum Product Owner (CSPO)', 'Google Project Management Certificate']
  }
];

function createCV(candidate, index) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
      info: { Title: `${candidate.name} - CV` }
    });

    const filePath = path.join(outputDir, `${candidate.name.toLowerCase().replace(/\s+/g, '-')}-cv.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const blue = '#1e40af';
    const gray = '#6b7280';
    const lightGray = '#f3f4f6';

    // ─── HEADER BAR ─────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 140).fill(blue);

    doc.fillColor('#ffffff')
      .fontSize(28)
      .font('Helvetica-Bold')
      .text(candidate.name, doc.page.margins.left, 30, { width: pageWidth });

    doc.fontSize(14)
      .font('Helvetica')
      .text(candidate.title, doc.page.margins.left, 65, { width: pageWidth });

    doc.fontSize(9)
      .fillColor('#bfdbfe')
      .text(`${candidate.phone}  |  ${candidate.email}  |  ${candidate.linkedin}`, doc.page.margins.left, 90, { width: pageWidth });

    // ─── SUMMARY ────────────────────────────────────────
    let yPos = 170;

    doc.fillColor(blue)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('PROFESSIONAL SUMMARY', doc.page.margins.left, yPos, { width: pageWidth });

    doc.moveTo(doc.page.margins.left, yPos + 18)
      .lineTo(doc.page.margins.left + pageWidth, yPos + 18)
      .strokeColor(blue)
      .stroke();

    doc.fillColor('#374151')
      .fontSize(10)
      .font('Helvetica')
      .text(candidate.summary, doc.page.margins.left, yPos + 26, { width: pageWidth, align: 'justify' });

    // ─── SKILLS ──────────────────────────────────────────
    yPos += 70;
    doc.fillColor(blue)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('TECHNICAL SKILLS', doc.page.margins.left, yPos, { width: pageWidth });

    doc.moveTo(doc.page.margins.left, yPos + 18)
      .lineTo(doc.page.margins.left + pageWidth, yPos + 18)
      .strokeColor(blue)
      .stroke();

    // Skills as tags
    yPos += 28;
    let xPos = doc.page.margins.left;
    candidate.skills.forEach((skill, i) => {
      const skillWidth = doc.fontSize(9).font('Helvetica-Bold').widthOfString(skill) + 16;
      if (xPos + skillWidth > doc.page.margins.left + pageWidth) {
        xPos = doc.page.margins.left;
        yPos += 22;
      }
      doc.roundedRect(xPos, yPos, skillWidth, 18, 4).fill(lightGray);
      doc.fillColor('#1f2937')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(skill, xPos + 8, yPos + 4, { width: skillWidth - 16, align: 'center' });
      doc.fillColor('#000000');
      xPos += skillWidth + 6;
    });

    // ─── EXPERIENCE ─────────────────────────────────────
    yPos += 35;
    if (yPos > 650) {
      doc.addPage();
      yPos = 50;
    }

    doc.fillColor(blue)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('PROFESSIONAL EXPERIENCE', doc.page.margins.left, yPos, { width: pageWidth });

    doc.moveTo(doc.page.margins.left, yPos + 18)
      .lineTo(doc.page.margins.left + pageWidth, yPos + 18)
      .strokeColor(blue)
      .stroke();

    yPos += 30;
    candidate.experience.forEach((exp) => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      doc.fillColor('#111827')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(exp.role, doc.page.margins.left, yPos, { width: pageWidth - 100 });

      doc.fillColor(gray)
        .fontSize(10)
        .font('Helvetica')
        .text(exp.period, doc.page.margins.left + pageWidth - 90, yPos, { width: 90, align: 'right' });

      doc.fillColor('#4b5563')
        .fontSize(10)
        .font('Helvetica-Oblique')
        .text(exp.company, doc.page.margins.left, yPos + 14, { width: pageWidth });

      yPos += 32;
      exp.highlights.forEach(h => {
        if (yPos > 730) {
          doc.addPage();
          yPos = 50;
        }
        doc.fillColor('#374151')
          .fontSize(9)
          .font('Helvetica')
          .text(`  •  ${h}`, doc.page.margins.left, yPos, { width: pageWidth - 15, align: 'justify' });
        yPos += 16;
      });
      yPos += 10;
    });

    // ─── EDUCATION ──────────────────────────────────────
    if (yPos > 650) {
      doc.addPage();
      yPos = 50;
    }

    doc.fillColor(blue)
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('EDUCATION', doc.page.margins.left, yPos, { width: pageWidth });

    doc.moveTo(doc.page.margins.left, yPos + 18)
      .lineTo(doc.page.margins.left + pageWidth, yPos + 18)
      .strokeColor(blue)
      .stroke();

    doc.fillColor('#374151')
      .fontSize(10)
      .font('Helvetica')
      .text(candidate.education, doc.page.margins.left, yPos + 26, { width: pageWidth });

    yPos += 55;

    // ─── CERTIFICATIONS ─────────────────────────────────
    if (candidate.certifications && candidate.certifications.length > 0) {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      doc.fillColor(blue)
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('CERTIFICATIONS', doc.page.margins.left, yPos, { width: pageWidth });

      doc.moveTo(doc.page.margins.left, yPos + 18)
        .lineTo(doc.page.margins.left + pageWidth, yPos + 18)
        .strokeColor(blue)
        .stroke();

      yPos += 28;
      candidate.certifications.forEach(cert => {
        if (yPos > 750) {
          doc.addPage();
          yPos = 50;
        }
        doc.fillColor('#374151')
          .fontSize(10)
          .font('Helvetica')
          .text(`  •  ${cert}`, doc.page.margins.left, yPos, { width: pageWidth });
        yPos += 18;
      });
    }

    // ─── FOOTER ──────────────────────────────────────────
    doc.fillColor(gray)
      .fontSize(8)
      .font('Helvetica')
      .text(`${candidate.name}  •  ${candidate.email}  •  ${candidate.phone}`, doc.page.margins.left, doc.page.height - 30, { width: pageWidth, align: 'center' });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

async function generateAll() {
  console.log('Generating sample CV PDFs...\n');
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    await createCV(c, i);
    console.log(`  ✅ ${i + 1}. ${c.name} - ${c.title}`);
  }
  console.log(`\n📁 All CVs saved to: ${outputDir}`);
  console.log('   Ready to upload and test!');
}

generateAll().catch(console.error);
