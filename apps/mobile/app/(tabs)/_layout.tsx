import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { font, theme } from '../../src/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Today', icon: 'sunny-outline' },
  { name: 'spin', title: 'Spin', icon: 'sync-circle-outline' },
  { name: 'snap', title: 'Snap', icon: 'camera-outline' },
  { name: 'kitchen', title: 'Kitchen', icon: 'restaurant-outline' },
];

export default function TabLayout() {
  const t = theme[useColorScheme() === 'light' ? 'light' : 'dark'];
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.raised },
        tabBarLabelStyle: { fontFamily: font.bodyBold },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} color={color as string} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
