import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { Links } from "@/component/Links";
import AccountMenu from "@/component/Account-Menu";
import Image from "next/image";
import Wappen from "@/img/Wappen.png";
import "./globals.css";


export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="de">
      <body>
        <header style={{ display: "flex", /*flexWrap: "wrap",*/ justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #eee", gap: "60px", backgroundColor: "rgb(74,74,255)", width: "100%", minHeight: "150px" }}>
          {/* logo and title on left side */}
          <div className="flex items-center">
            <Image src={Wappen} alt="Wappen-Vandalie" width={150} height={110} />
            <div className="title-container">
              <div className="title">Vandalia DigitalPlatform</div>
            </div>
          </div>

          {user ? <Links role={user.role} /> : null}
          <AccountMenu user={user} />
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
