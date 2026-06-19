import { PushToggle } from "@/components/features/push/push-toggle";

export function PublicFooter() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  return (
    <footer className="border-t border-brand-border-dark bg-brand-card-dark px-4 py-6 text-xs leading-relaxed text-brand-muted">
      <div className="mx-auto max-w-6xl space-y-2">
        {vapidPublicKey ? (
          <div className="border-b border-brand-border-dark pb-3">
            <PushToggle vapidPublicKey={vapidPublicKey} />
          </div>
        ) : null}
        <p>
          本サイトはドンデコルテおよび吉本興業とは無関係の非公式ファンサイトです。
        </p>
        <p>
          掲載情報の正確性は保証しません。権利者様からの削除要請には速やかに対応いたします。
        </p>
        <p className="pt-2 text-brand-brown-light">
          &copy; {new Date().getFullYear()} DonDecorte Lab
        </p>
      </div>
    </footer>
  );
}
