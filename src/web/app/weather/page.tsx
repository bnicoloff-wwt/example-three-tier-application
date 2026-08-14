import { WeatherClient } from './WeatherClient';

export const metadata = {
  title: 'Weather',
  description: 'Check the current weather',
};

export default function WeatherPage() {
  return <WeatherClient />;
}
