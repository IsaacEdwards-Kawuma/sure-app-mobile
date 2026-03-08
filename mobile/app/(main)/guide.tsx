import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { colors } from '../../src/theme';

export default function GuideScreen() {
  const { spacing } = useResponsive();
  const { background, surface, textPrimary, textSecondary } = useAppTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: background }]} contentContainerStyle={[styles.content, { padding: spacing.screenHorizontal, paddingBottom: 32 }]}>
      <Text variant="headlineSmall" style={[styles.title, { color: textPrimary }]}>SureLink WiFi Manager — Guide</Text>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.accent }]}>Dashboard</Text>
          <Text variant="bodyMedium" style={[styles.body, { color: textSecondary }]}>
            View KPIs: total revenue, net after expenses, best day, average per day, downtime days, total expenses, and voucher stock (total, sold, unused).
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.accent }]}>Daily Entry</Text>
          <Text variant="bodyMedium" style={[styles.body, { color: textSecondary }]}>
            Record each day’s revenue: date, attendant (optional), total revenue, downtime, and notes. Save to add a daily sale entry.
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.accent }]}>Vouchers</Text>
          <Text variant="bodyMedium" style={[styles.body, { color: textSecondary }]}>
            Generate batches of voucher codes (set count, package name, price). Sell vouchers by entering their codes to mark them as sold. Filter by Unused / Sold.
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.accent }]}>Reconcile</Text>
          <Text variant="bodyMedium" style={[styles.body, { color: textSecondary }]}>
            Compare total revenue from daily entries with the total value of sold vouchers. Variance shows the difference (e.g. other income or discrepancies).
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.accent }]}>Sales Log</Text>
          <Text variant="bodyMedium" style={[styles.body, { color: textSecondary }]}>
            List of all daily entries. You can delete an entry if needed (linked expenses are removed).
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>Expenses</Text>
          <Text variant="bodyMedium" style={styles.body}>
            Record expenses with description, category, and amount. Filter by category (from Settings → Exp. Categories). Total is shown at the top.
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.accent }]}>Assets</Text>
          <Text variant="bodyMedium" style={[styles.body, { color: textSecondary }]}>
            Register business assets: name, category, value, status. View total value of all assets.
          </Text>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: colors.accent }]}>Settings (admin)</Text>
          <Text variant="bodyMedium" style={[styles.body, { color: textSecondary }]}>
            Configure business info, users, revenue sources, voucher packages, fixed costs, expense categories, subscriptions, and admin log. Download a JSON backup of all data.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  title: { marginBottom: 16 },
  card: { marginBottom: 12 },
  cardTitle: { marginBottom: 8 },
  body: { lineHeight: 22 },
});
