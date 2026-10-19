/* Logos are used unaltered, at their own aspect ratio, from the official sites:
   undip.ac.id (Undip-Logo.png) and kemendukbangga.go.id (BKKBN logo). */
export function Partners() {
  return (
    <div className="mt-6">
      <p className="text-xs text-mute">Dikembangkan untuk puskesmas di Parakan Kauman, Temanggung</p>
      <div className="mt-3 flex items-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/undip.png" width={381} height={446} alt="Logo Universitas Diponegoro" className="h-14 w-auto" loading="lazy" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/bkkbn.png" width={1200} height={320} alt="Logo Kementerian Kependudukan dan Pembangunan Keluarga/BKKBN" className="h-12 w-auto min-w-0 max-w-[60%]" loading="lazy" />
      </div>
    </div>
  );
}
