import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import { router } from "expo-router";
import { Bell, LogOut, Moon, Shield, Sun, UserCog } from "lucide-react-native";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { useUiStore } from "../../../stores/ui-store";
import { useAuth } from "../../auth/hooks/useAuth";
import { useLogoutMutation } from "../../auth/hooks/useAuthMutations";

export function SettingsScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const logout = useLogoutMutation();
  const themeMode = useUiStore((state) => state.themeMode);
  const setThemeMode = useUiStore((state) => state.setThemeMode);

  async function handleLogout() {
    try {
      await logout.mutateAsync();
      router.replace("/login");
    } catch {
      Alert.alert("No se pudo cerrar sesion", "Intentalo de nuevo en unos segundos.");
    }
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Ajustes</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Cuenta, privacidad, seguridad y preferencias de experiencia.
          </Text>
        </View>

        <SettingsPanel title="Cuenta" icon={<UserCog size={19} color={theme.colors.secondary} />}>
          <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
            {auth.profile?.display_name ?? auth.profile?.username ?? "Perfil activo"}
          </Text>
          <Button
            title="Editar perfil"
            variant="secondary"
            onPress={() => router.push("/settings/edit-profile")}
          />
        </SettingsPanel>

        <SettingsPanel title="Privacidad" icon={<Shield size={19} color={theme.colors.success} />}>
          <View style={styles.badges}>
            <Badge label="Bloqueos activos por RLS" tone="success" />
            <Badge label="Reportes privados" tone="secondary" />
          </View>
          <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
            Los bloqueos reducen visibilidad entre cuentas y los mensajes solo se leen por miembros
            de cada conversacion.
          </Text>
        </SettingsPanel>

        <SettingsPanel title="Notificaciones" icon={<Bell size={19} color={theme.colors.warning} />}>
          <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
            Expo Notifications queda preparado para activar push cuando exista proyecto EAS y canales.
          </Text>
          <Badge label="Modulo opcional preparado" tone="warning" />
        </SettingsPanel>

        <SettingsPanel title="Apariencia" icon={<Moon size={19} color={theme.colors.accent} />}>
          <View style={styles.actions}>
            <Button
              title="Oscuro"
              variant={themeMode === "dark" ? "primary" : "secondary"}
              icon={<Moon size={17} color={themeMode === "dark" ? "#FFFFFF" : theme.colors.text} />}
              onPress={() => setThemeMode("dark")}
            />
            <Button
              title="Claro"
              variant={themeMode === "light" ? "primary" : "secondary"}
              icon={<Sun size={17} color={themeMode === "light" ? "#FFFFFF" : theme.colors.text} />}
              onPress={() => setThemeMode("light")}
            />
          </View>
        </SettingsPanel>

        <SettingsPanel title="Moderacion" icon={<Shield size={19} color={theme.colors.error} />}>
          <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
            Si eres mod, puedes revisar la cola de reportes y ocultar contenido.
          </Text>
          <Button
            title="Abrir cola"
            variant="secondary"
            onPress={() => router.push("/moderation")}
          />
        </SettingsPanel>

        <Button
          title="Cerrar sesion"
          variant="danger"
          loading={logout.isPending}
          icon={<LogOut size={18} color="#FFFFFF" />}
          onPress={handleLogout}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingsPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.panelHeader}>
        {icon}
        <Text style={[styles.panelTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingTop: 8,
    paddingBottom: 28,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 21,
  },
  panel: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelTitle: {
    fontSize: typography.h3,
    fontWeight: "900",
  },
  copy: {
    fontSize: typography.body,
    lineHeight: 21,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
