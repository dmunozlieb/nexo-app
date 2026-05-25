import { LegalDocumentScreen } from "../src/features/legal/components/LegalDocumentScreen";

export default function PrivacyRoute() {
  return (
    <LegalDocumentScreen
      eyebrow="Privacy"
      title="Privacy Policy"
      updatedAt="May 25, 2026"
      intro="Nexo is a social community app built around Orbitas: spaces where people can create profiles, discover communities, publish posts, chat, and interact with other members. This policy explains what information we collect and how we use it while the product is in demo and early development."
      sections={[
        {
          title: "Information we collect",
          body: [
            "When you create an account or sign in, we may collect your email address, display name, username, profile avatar, authentication provider, and basic account metadata.",
            "When you use Nexo, we may store profile details, selected interests, communities you create or join, posts, comments, reactions, chat messages, reports, blocks, and moderation actions.",
            "If you sign in with Google, Google may share your name, email address, profile picture, and verification status with our authentication provider.",
          ],
        },
        {
          title: "How we use information",
          body: [
            "We use your information to authenticate you, create your profile, show relevant communities, enable social features, keep conversations available, and protect the app from abuse.",
            "We may use reports, blocks, moderation status, and activity signals to maintain safer communities and enforce community rules.",
          ],
        },
        {
          title: "Service providers",
          body: [
            "Nexo uses Supabase for authentication, database, storage, and realtime features. Google may be used as a sign-in provider when you choose Google login.",
            "These providers process information only as needed to provide the services used by Nexo.",
          ],
        },
        {
          title: "Data retention and deletion",
          body: [
            "We keep account and community data while your account is active or while needed to operate the service, comply with safety needs, or resolve issues.",
            "You can request deletion of your account or personal data by contacting us. During demo development, deletion may be handled manually.",
          ],
        },
        {
          title: "Security",
          body: [
            "We use platform authentication, database access controls, and row-level security policies to limit access to user data.",
            "No system is perfect, but we aim to keep access scoped, avoid storing unnecessary secrets in the client, and improve security as the product matures.",
          ],
        },
        {
          title: "Changes",
          body: [
            "We may update this policy as Nexo evolves. The latest version will remain available on this page.",
          ],
        },
      ]}
    />
  );
}
