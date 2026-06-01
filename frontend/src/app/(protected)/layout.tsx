import { Navbar } from "@/components/layout/navbar";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { OnboardingModal } from "@/components/onboarding-modal";
import { InactivityWrapper } from "@/components/inactivity-wrapper";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AnnouncementBanner />
      <Navbar />
      <InactivityWrapper>
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </InactivityWrapper>
      <OnboardingModal />
    </div>
  );
}
