import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../theme/useTheme";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalDocumentScreenProps = {
  eyebrow: string;
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalDocumentScreen({
  eyebrow,
  title,
  updatedAt,
  intro,
  sections,
}: LegalDocumentScreenProps) {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.brandRow}>
          <View
            style={[
              styles.logo,
              {
                backgroundColor: theme.colors.elevated,
                borderColor: `${theme.colors.secondary}66`,
              },
            ]}
          >
            <Text style={[styles.logoText, { color: theme.colors.text }]}>
              N
            </Text>
          </View>
          <View>
            <Text style={[styles.eyebrow, { color: theme.colors.secondary }]}>
              {eyebrow}
            </Text>
            <Text style={[styles.brand, { color: theme.colors.text }]}>
              Nexo
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.textFaint }]}>
          Last updated: {updatedAt}
        </Text>
        <Text style={[styles.intro, { color: theme.colors.textMuted }]}>
          {intro}
        </Text>

        <View style={styles.sections}>
          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {section.title}
              </Text>
              {section.body.map((paragraph) => (
                <Text
                  key={paragraph}
                  style={[styles.paragraph, { color: theme.colors.textMuted }]}
                >
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          <Link href="/login" style={[styles.link, { color: theme.colors.secondary }]}>
            Back to Nexo
          </Link>
          <Text style={[styles.contact, { color: theme.colors.textFaint }]}>
            Contact: danielmunozliebana@gmail.com
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 860,
    padding: 28,
    width: "100%",
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  logo: {
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "900",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  brand: {
    fontSize: 22,
    fontWeight: "900",
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 18,
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
  },
  sections: {
    gap: 22,
    marginTop: 30,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 23,
  },
  footer: {
    borderTopWidth: 1,
    gap: 10,
    marginTop: 30,
    paddingTop: 18,
  },
  link: {
    fontSize: 15,
    fontWeight: "900",
  },
  contact: {
    fontSize: 13,
    lineHeight: 20,
  },
});
