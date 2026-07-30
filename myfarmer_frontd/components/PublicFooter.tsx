import Image from 'next/image';

const phoneContacts = [
  {
    label: 'WhatsApp (chat only)',
    value: '0816 1609 937',
    href: 'https://wa.me/628161609937',
  },
  {
    label: 'Telepon',
    value: '(0341) 464827',
    href: 'tel:+62341464827',
  },
  {
    label: 'Telepon',
    value: '(0341) 461388',
    href: 'tel:+62341461388',
  },
  {
    label: 'Telepon',
    value: '(0341) 461595',
    href: 'tel:+62341461595',
  },
];

const emailAddresses = [
  'zentana33@yahoo.com',
  'staklim.jatim@bmkg.go.id',
  'staklimkarangploso@gmail.com',
];

const socialMediaLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com/BMKGIklimJatim' },
  { label: 'Twitter', href: 'https://www.twitter.com/bmkgiklimjatim' },
  { label: 'Instagram', href: 'https://www.instagram.com/bmkg.iklimjatim/' },
  { label: 'Telegram Bot', href: 'https://t.me/BMKGstaklimmalang_bot' },
  { label: 'Telegram Channel', href: 'https://t.me/s/bmkg_jatim' },
  { label: 'WhatsApp Channel', href: 'https://whatsapp.com/channel/0029VaHHLONCBtx7a6adTF2N' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@bmkg.iklimjatim' },
  { label: 'Google Review', href: 'https://g.co/kgs/kMpnvZg' },
  { label: 'YouTube Channel', href: 'https://www.youtube.com/c/StasiunklimatologiKarangplosomalang' },
];

const bmkgLinks = [
  { label: 'Informasi Cuaca Jawa Timur', href: 'https://stamet-juanda.bmkg.go.id/' },
  {
    label: 'Prakiraan Cuaca Maritim dan Tinggi Gelombang Provinsi Jawa Timur',
    href: 'https://maritim.bmkg.go.id/',
  },
  { label: 'CEWS (Climate Early Warning System)', href: 'http://cews.bmkg.go.id/' },
  { label: 'Data Online BMKG', href: 'http://dataonline.bmkg.go.id/' },
  { label: 'Pusdiklat BMKG', href: 'http://pusdiklat.bmkg.go.id/' },
  { label: 'BMKG Pusat Jakarta', href: 'https://www.bmkg.go.id/' },
];

const footerLinkClass =
  'text-white/70 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white hover:decoration-[#16a34a] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050726]';

const footerAnimationCss = `
.public-footer-scene {
  --footer-navy: #12175c;
  --footer-navy-2: #181f6e;
  --footer-navy-dark: #050726;
  --footer-accent: #b9c6f2;
  --footer-accent-2: #dfe6fb;
  --footer-bg: #fafafa;
  height: clamp(120px, 14vw, 220px);
  overflow: hidden;
  line-height: 0;
}
.public-footer-scene svg {
  display: block;
  width: 100%;
  height: 100%;
}
@keyframes footer-spin-anemo {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.public-footer-scene .footer-anemo-spin {
  transform-box: view-box;
  transform-origin: 95px 54px;
  animation: footer-spin-anemo 3.2s linear infinite;
}
@keyframes footer-sway-vane {
  0%, 100% { transform: rotate(-16deg); }
  50% { transform: rotate(16deg); }
}
.public-footer-scene .footer-wind-vane {
  transform-box: view-box;
  transform-origin: 95px 92px;
  animation: footer-sway-vane 4.5s ease-in-out infinite;
}
@keyframes footer-sway-tree {
  0%, 100% { transform: rotate(-1.6deg); }
  50% { transform: rotate(1.6deg); }
}
.public-footer-scene .footer-tree-sway {
  transform-box: fill-box;
  transform-origin: bottom center;
  animation: footer-sway-tree 4.8s ease-in-out infinite;
}
.public-footer-scene .footer-tree-sway.footer-tree-b {
  animation-delay: .4s;
  animation-duration: 5.6s;
}
@keyframes footer-spin-sun {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.public-footer-scene .footer-sun-rays {
  transform-box: fill-box;
  transform-origin: center;
  animation: footer-spin-sun 22s linear infinite;
}
@keyframes footer-glint-pulse {
  0%, 100% { opacity: .25; }
  50% { opacity: .9; }
}
.public-footer-scene .footer-glint {
  animation: footer-glint-pulse 2.6s ease-in-out infinite;
}
@keyframes footer-drop-fall {
  0% { transform: translateY(-6px); opacity: 0; }
  15%, 85% { opacity: 1; }
  100% { transform: translateY(26px); opacity: 0; }
}
.public-footer-scene .footer-drop {
  transform-box: fill-box;
  transform-origin: center;
  animation: footer-drop-fall 2.4s linear infinite;
}
.public-footer-scene .footer-drop-2 { animation-delay: .8s; }
.public-footer-scene .footer-drop-3 { animation-delay: 1.6s; }
@keyframes footer-drift-cloud {
  from { transform: translateX(0); }
  to { transform: translateX(-1900px); }
}
.public-footer-scene .footer-cloud { animation: footer-drift-cloud linear infinite; }
.public-footer-scene .footer-cloud-1 { animation-duration: 55s; }
.public-footer-scene .footer-cloud-2 { animation-delay: -20s; animation-duration: 75s; }
.public-footer-scene .footer-cloud-3 { animation-delay: -40s; animation-duration: 65s; }
@keyframes footer-fly-bird {
  0% { transform: translate(0, 0); }
  50% { transform: translate(-850px, -14px); }
  100% { transform: translate(-1900px, 0); }
}
.public-footer-scene .footer-bird { animation: footer-fly-bird linear infinite; }
.public-footer-scene .footer-bird-1 { animation-duration: 26s; }
.public-footer-scene .footer-bird-2 { animation-delay: -10s; animation-duration: 32s; }
@keyframes footer-sway-grass {
  0%, 100% { transform: rotate(-4deg); }
  50% { transform: rotate(4deg); }
}
.public-footer-scene .footer-grass {
  transform-box: fill-box;
  transform-origin: bottom center;
  animation: footer-sway-grass 3s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .public-footer-scene .footer-anemo-spin,
  .public-footer-scene .footer-wind-vane,
  .public-footer-scene .footer-tree-sway,
  .public-footer-scene .footer-sun-rays,
  .public-footer-scene .footer-glint,
  .public-footer-scene .footer-drop,
  .public-footer-scene .footer-cloud,
  .public-footer-scene .footer-bird,
  .public-footer-scene .footer-grass {
    animation: none !important;
  }
}
`;

const footerAnimationSvg = `
<svg viewBox="0 0 1600 220" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustrasi taman alat Stasiun Klimatologi Jawa Timur">
  <g class="footer-bird footer-bird-1">
    <path d="M1650 40 q10 -10 20 0 q10 -10 20 0" fill="none" stroke="var(--footer-navy)" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  <g class="footer-bird footer-bird-2">
    <path d="M1600 65 q8 -8 16 0 q8 -8 16 0" fill="none" stroke="var(--footer-navy)" stroke-width="2.2" stroke-linecap="round"/>
  </g>
  <g class="footer-cloud footer-cloud-1" opacity="0.55">
    <ellipse cx="1750" cy="45" rx="42" ry="16" fill="var(--footer-accent)"/>
    <ellipse cx="1785" cy="38" rx="30" ry="13" fill="var(--footer-accent)"/>
    <ellipse cx="1715" cy="40" rx="28" ry="12" fill="var(--footer-accent)"/>
  </g>
  <g class="footer-cloud footer-cloud-2" opacity="0.45">
    <ellipse cx="1900" cy="75" rx="50" ry="18" fill="var(--footer-accent)"/>
    <ellipse cx="1945" cy="68" rx="32" ry="14" fill="var(--footer-accent)"/>
    <ellipse cx="1858" cy="70" rx="30" ry="13" fill="var(--footer-accent)"/>
  </g>
  <g class="footer-cloud footer-cloud-3" opacity="0.5">
    <ellipse cx="2050" cy="30" rx="38" ry="14" fill="var(--footer-accent)"/>
    <ellipse cx="2082" cy="24" rx="26" ry="11" fill="var(--footer-accent)"/>
  </g>
  <g transform="translate(900,42)">
    <g class="footer-sun-rays" opacity="0.55">
      <g stroke="var(--footer-navy)" stroke-width="2" stroke-linecap="round">
        <line x1="0" y1="-22" x2="0" y2="-14"/>
        <line x1="0" y1="22" x2="0" y2="14"/>
        <line x1="-22" y1="0" x2="-14" y2="0"/>
        <line x1="22" y1="0" x2="14" y2="0"/>
        <line x1="-15.5" y1="-15.5" x2="-9.9" y2="-9.9"/>
        <line x1="15.5" y1="15.5" x2="9.9" y2="9.9"/>
        <line x1="-15.5" y1="15.5" x2="-9.9" y2="9.9"/>
        <line x1="15.5" y1="-15.5" x2="9.9" y2="-9.9"/>
      </g>
    </g>
    <circle r="9" fill="var(--footer-navy)"/>
  </g>
  <rect x="0" y="170" width="1600" height="15" fill="var(--footer-navy)"/>
  <rect x="0" y="185" width="1600" height="35" fill="var(--footer-navy-dark)"/>
  <g>
    <rect x="92" y="58" width="6" height="112" fill="var(--footer-navy)"/>
    <g class="footer-wind-vane">
      <line x1="95" y1="92" x2="129" y2="86" stroke="var(--footer-navy)" stroke-width="3" stroke-linecap="round"/>
      <polygon points="129,86 139,89 129,94" fill="var(--footer-navy)"/>
    </g>
    <g class="footer-anemo-spin">
      <g stroke="var(--footer-navy)" stroke-width="3" stroke-linecap="round">
        <line x1="95" y1="54" x2="95" y2="28"/>
        <line x1="95" y1="54" x2="117" y2="67"/>
        <line x1="95" y1="54" x2="73" y2="67"/>
      </g>
      <circle cx="95" cy="28" r="7" fill="var(--footer-navy)"/>
      <circle cx="117" cy="67" r="7" fill="var(--footer-navy)"/>
      <circle cx="73" cy="67" r="7" fill="var(--footer-navy)"/>
    </g>
  </g>
  <g>
    <rect x="150" y="128" width="7" height="42" fill="var(--footer-navy)"/>
    <rect x="180" y="128" width="7" height="42" fill="var(--footer-navy)"/>
    <rect x="278" y="128" width="7" height="42" fill="var(--footer-navy)"/>
    <rect x="308" y="128" width="7" height="42" fill="var(--footer-navy)"/>
    <rect x="142" y="58" width="175" height="72" fill="var(--footer-navy)"/>
    <polygon points="136,58 323,58 230,32" fill="var(--footer-navy)"/>
    <line x1="136" y1="58" x2="230" y2="32" stroke="var(--footer-accent)" stroke-width="2"/>
    <line x1="323" y1="58" x2="230" y2="32" stroke="var(--footer-accent)" stroke-width="2"/>
    <g fill="var(--footer-accent-2)">
      <rect x="152" y="66" width="7" height="7"/>
      <rect x="163" y="66" width="7" height="7"/>
      <rect x="174" y="66" width="7" height="7"/>
      <rect x="185" y="66" width="7" height="7"/>
      <rect x="196" y="66" width="7" height="7"/>
      <rect x="207" y="66" width="7" height="7"/>
      <rect x="218" y="66" width="7" height="7"/>
      <rect x="229" y="66" width="7" height="7"/>
      <rect x="240" y="66" width="7" height="7"/>
      <rect x="251" y="66" width="7" height="7"/>
      <rect x="262" y="66" width="7" height="7"/>
      <rect x="273" y="66" width="7" height="7"/>
      <rect x="284" y="66" width="7" height="7"/>
      <rect x="295" y="66" width="7" height="7"/>
    </g>
    <rect x="155" y="86" width="72" height="36" fill="var(--footer-bg)"/>
    <rect x="233" y="86" width="72" height="36" fill="var(--footer-bg)"/>
    <line x1="155" y1="95" x2="227" y2="95" stroke="var(--footer-navy)" stroke-width="2"/>
    <line x1="155" y1="104" x2="227" y2="104" stroke="var(--footer-navy)" stroke-width="2"/>
    <line x1="155" y1="113" x2="227" y2="113" stroke="var(--footer-navy)" stroke-width="2"/>
    <line x1="233" y1="95" x2="305" y2="95" stroke="var(--footer-navy)" stroke-width="2"/>
    <line x1="233" y1="104" x2="305" y2="104" stroke="var(--footer-navy)" stroke-width="2"/>
    <line x1="233" y1="113" x2="305" y2="113" stroke="var(--footer-navy)" stroke-width="2"/>
    <rect x="317" y="112" width="55" height="8" fill="var(--footer-navy)"/>
    <rect x="317" y="124" width="40" height="6" fill="var(--footer-navy)"/>
  </g>
  <g class="footer-grass"><path d="M400,170 q4,-16 0,-24 q-4,8 0,24" fill="var(--footer-navy)"/></g>
  <g class="footer-grass" style="animation-delay:.5s"><path d="M415,170 q4,-13 0,-20 q-4,7 0,20" fill="var(--footer-navy)"/></g>
  <g class="footer-tree-sway">
    <rect x="518" y="150" width="8" height="20" fill="var(--footer-navy)"/>
    <polygon points="522,60 545,100 499,100" fill="var(--footer-navy)"/>
    <polygon points="522,78 549,118 495,118" fill="var(--footer-navy)"/>
    <polygon points="522,98 553,140 491,140" fill="var(--footer-navy)"/>
  </g>
  <g>
    <line x1="900" y1="170" x2="880" y2="138" stroke="var(--footer-navy)" stroke-width="4" stroke-linecap="round"/>
    <line x1="900" y1="170" x2="920" y2="138" stroke="var(--footer-navy)" stroke-width="4" stroke-linecap="round"/>
    <line x1="900" y1="170" x2="900" y2="132" stroke="var(--footer-navy)" stroke-width="4" stroke-linecap="round"/>
    <path d="M878,120 A22,22 0 0 1 922,120" fill="none" stroke="var(--footer-navy)" stroke-width="4" stroke-linecap="round"/>
    <circle cx="900" cy="112" r="17" fill="var(--footer-accent)" stroke="var(--footer-navy)" stroke-width="2.5"/>
    <circle class="footer-glint" cx="894" cy="106" r="3.2" fill="var(--footer-bg)"/>
  </g>
  <g>
    <g class="footer-drop"><path d="M1050,60 q4,6 0,10 q-4,-4 0,-10" fill="var(--footer-accent)"/></g>
    <g class="footer-drop footer-drop-2"><path d="M1058,55 q4,6 0,10 q-4,-4 0,-10" fill="var(--footer-accent)"/></g>
    <g class="footer-drop footer-drop-3"><path d="M1043,58 q4,6 0,10 q-4,-4 0,-10" fill="var(--footer-accent)"/></g>
    <line x1="1050" y1="170" x2="1034" y2="142" stroke="var(--footer-navy)" stroke-width="4" stroke-linecap="round"/>
    <line x1="1050" y1="170" x2="1066" y2="142" stroke="var(--footer-navy)" stroke-width="4" stroke-linecap="round"/>
    <rect x="1038" y="96" width="24" height="46" fill="var(--footer-navy)"/>
    <polygon points="1030,86 1070,86 1058,96 1042,96" fill="var(--footer-navy)"/>
    <ellipse cx="1050" cy="86" rx="20" ry="5" fill="var(--footer-accent-2)"/>
  </g>
  <g>
    <path d="M1250,170 a18,18 0 0 1 36,0 z" fill="var(--footer-accent)"/>
    <path d="M1430,170 a16,16 0 0 1 32,0 z" fill="var(--footer-accent)"/>
    <rect x="1290" y="90" width="120" height="80" fill="var(--footer-navy)"/>
    <polygon points="1278,90 1422,90 1350,40" fill="var(--footer-navy)"/>
    <polyline points="1278,90 1350,40 1422,90" fill="none" stroke="var(--footer-accent)" stroke-width="3"/>
    <line x1="1350" y1="40" x2="1350" y2="18" stroke="var(--footer-navy)" stroke-width="3"/>
    <circle cx="1350" cy="15" r="3.5" fill="var(--footer-navy)"/>
    <line x1="1343" y1="24" x2="1357" y2="24" stroke="var(--footer-navy)" stroke-width="2"/>
    <rect x="1335" y="128" width="30" height="42" fill="var(--footer-bg)"/>
    <rect x="1298" y="108" width="24" height="22" fill="var(--footer-accent-2)"/>
  </g>
  <g class="footer-tree-sway footer-tree-b">
    <rect x="1470" y="150" width="8" height="20" fill="var(--footer-navy)"/>
    <polygon points="1474,60 1497,100 1451,100" fill="var(--footer-navy)"/>
    <polygon points="1474,78 1501,118 1447,118" fill="var(--footer-navy)"/>
    <polygon points="1474,98 1505,140 1443,140" fill="var(--footer-navy)"/>
  </g>
</svg>
`;

export function PublicFooter() {
  return (
    <section className="-mx-6 -mb-10 mt-10 lg:-mx-11" aria-label="Footer Stasiun Klimatologi Jawa Timur">
      <style>{footerAnimationCss}</style>
      <div
        className="public-footer-scene"
        dangerouslySetInnerHTML={{ __html: footerAnimationSvg }}
      />
      <footer className="bg-[#050726] text-white">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="py-10 xl:py-12">
            <div className="flex items-center gap-4">
              <Image
                src="/logo_bmkg.png"
                alt="Logo BMKG"
                width={56}
                height={56}
                className="h-14 w-14 shrink-0"
              />
              <div>
                <div className="text-lg font-semibold leading-tight">Stasiun Klimatologi</div>
                <div className="text-sm font-medium text-white/70">Jawa Timur</div>
              </div>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/70">
              Informasi iklim, cuaca, dan rekomendasi tanam untuk mendukung keputusan pertanian.
            </p>
          </div>

          <div className="grid gap-10 border-t border-white/10 py-10 lg:grid-cols-12 xl:py-12">
            <section className="lg:col-span-7" aria-labelledby="footer-address-title">
              <h2 id="footer-address-title" className="text-base font-semibold">
                Alamat Kantor
              </h2>
              <address className="mt-5 max-w-2xl text-sm not-italic leading-6 text-white/70">
                Jl. Zentana No. 33, RT 55/RW 08, Desa Ngijo, Kecamatan Karangploso,
                Kabupaten Malang, Provinsi Jawa Timur, Indonesia 65152.
              </address>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Koordinat GPS: 7° 54&apos; 4.02&quot; S, 112° 35&apos; 51.19&quot; E
              </p>

              <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                <iframe
                  title="Google Maps Stasiun Klimatologi Jawa Timur"
                  src="https://maps.google.com/maps?q=-7.901117,112.597553&z=15&output=embed"
                  className="h-64 w-full border-0 sm:h-72"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-white/55">-7.901117, 112.597553</span>
                  <a
                    href="https://goo.gl/maps/B8YxMuJYF292"
                    target="_blank"
                    rel="noreferrer"
                    className={footerLinkClass}
                  >
                    Buka di Google Maps <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </section>

            <div className="grid content-start gap-10 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              <section aria-labelledby="footer-service-hours-title">
                <h2 id="footer-service-hours-title" className="text-base font-semibold">
                  Jam Pelayanan Kantor
                </h2>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="font-medium text-white/90">Senin - Kamis</dt>
                    <dd className="mt-1 text-white/65">07:30 WIB - 16:00 WIB</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-white/90">Jumat</dt>
                    <dd className="mt-1 text-white/65">07:30 WIB - 16:30 WIB</dd>
                  </div>
                </dl>
              </section>

              <section aria-labelledby="footer-phone-title">
                <h2 id="footer-phone-title" className="text-base font-semibold">
                  Telepon
                </h2>
                <ul className="mt-5 space-y-3 text-sm">
                  {phoneContacts.map((contact) => (
                    <li key={`${contact.label}-${contact.value}`}>
                      <span className="block text-xs text-white/50">{contact.label}</span>
                      <a href={contact.href} className={footerLinkClass}>
                        {contact.value}
                      </a>
                    </li>
                  ))}
                  <li>
                    <span className="block text-xs text-white/50">Faksimile</span>
                    <span className="text-white/70">(0341) 464827</span>
                  </li>
                </ul>
              </section>
            </div>
          </div>

          <div className="grid gap-10 border-t border-white/10 py-10 sm:grid-cols-2 xl:grid-cols-4 xl:py-12">
            <section aria-labelledby="footer-email-title">
              <h2 id="footer-email-title" className="text-base font-semibold">
                Alamat Email
              </h2>
              <ul className="mt-5 space-y-3 text-sm">
                {emailAddresses.map((email) => (
                  <li key={email} className="break-words">
                    <a href={`mailto:${email}`} className={footerLinkClass}>
                      {email}
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="footer-website-title">
              <h2 id="footer-website-title" className="text-base font-semibold">
                Alamat Website
              </h2>
              <p className="mt-5 break-words text-sm">
                <a
                  href="https://staklim-jatim.bmkg.go.id/"
                  target="_blank"
                  rel="noreferrer"
                  className={footerLinkClass}
                >
                  staklim-jatim.bmkg.go.id
                </a>
              </p>
            </section>

            <section aria-labelledby="footer-social-title">
              <h2 id="footer-social-title" className="text-base font-semibold">
                Alamat Media Sosial
              </h2>
              <ul className="mt-5 space-y-3 text-sm">
                {socialMediaLinks.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={footerLinkClass}
                    >
                      {item.label} <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="footer-bmkg-links-title">
              <h2 id="footer-bmkg-links-title" className="text-base font-semibold">
                Link BMKG
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-6">
                {bmkgLinks.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={footerLinkClass}
                    >
                      {item.label} <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span>© 2026 Stasiun Klimatologi Jawa Timur. Seluruh hak cipta dilindungi.</span>
            <span>MyFarmer</span>
          </div>
        </div>
      </footer>
    </section>
  );
}
