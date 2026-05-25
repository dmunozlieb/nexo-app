import { LegalDocumentScreen } from "../src/features/legal/components/LegalDocumentScreen";

export default function TermsRoute() {
  return (
    <LegalDocumentScreen
      eyebrow="Terms"
      title="Terms of Service"
      updatedAt="May 25, 2026"
      intro="These terms describe the basic rules for using Nexo. Nexo is currently an early-stage social app and demo product, so features may change as the service evolves."
      sections={[
        {
          title: "Using Nexo",
          body: [
            "You may use Nexo to create a profile, discover Orbitas, join communities, publish posts, react, comment, and chat with other users.",
            "You are responsible for the information and content you submit through the app.",
          ],
        },
        {
          title: "Community conduct",
          body: [
            "Do not use Nexo to harass others, publish spam, impersonate people, share private information without permission, or post illegal, hateful, or harmful content.",
            "Community owners and moderators may enforce rules inside their Orbitas. Nexo may remove content or restrict accounts when needed to protect users or the service.",
          ],
        },
        {
          title: "User content",
          body: [
            "You keep ownership of the content you create, but you allow Nexo to display, store, and process that content so the app can provide community, feed, chat, moderation, and discovery features.",
            "Only upload content you have the right to share.",
          ],
        },
        {
          title: "Accounts and access",
          body: [
            "You are responsible for keeping access to your account secure. If you use Google login, Google handles the authentication step and Nexo receives the account information needed to sign you in.",
            "We may suspend or remove access if an account is used to harm other users, abuse the service, or violate these terms.",
          ],
        },
        {
          title: "Early product status",
          body: [
            "Nexo is provided as an early-stage product. Features, data models, availability, and user experience may change during development.",
            "The service is provided without warranties. We will try to keep it useful and available, but interruptions or bugs may happen.",
          ],
        },
        {
          title: "Changes",
          body: [
            "We may update these terms as Nexo grows. The latest version will remain available on this page.",
          ],
        },
      ]}
    />
  );
}
