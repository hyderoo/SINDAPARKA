"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { actions, useStore } from "@/lib/store";
import { AuthFrame, Msg } from "@/components/Auth";

export default function Menunggu() {
  const router = useRouter();
  const s = useStore();
  useEffect(() => {
    if (s?.ready && !s.userId) router.replace("/masuk");
    if (s?.status === "active") router.replace("/dashboard");
  }, [s, router]);
  if (!s?.userId) return null;
  return (
    <AuthFrame title={s.status === "disabled" ? "Akun dinonaktifkan" : "Menunggu persetujuan"}>
      <Msg kind={s.status === "disabled" ? "err" : "ok"}>
        {s.status === "disabled"
          ? "Akun Anda dinonaktifkan. Hubungi admin puskesmas."
          : "Akun Anda sudah terdaftar. Admin puskesmas perlu menyetujui dan menentukan posyandu Anda sebelum data anak bisa dibuka."}
      </Msg>
      <p className="mt-3 text-sm text-mute">Masuk sebagai {s.email}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button className="btn btn-ghost" onClick={() => actions.refresh()}>Cek lagi</button>
        <button className="btn btn-ghost" onClick={async () => { await actions.signOut(); router.replace("/masuk"); }}>Keluar</button>
      </div>
    </AuthFrame>
  );
}
