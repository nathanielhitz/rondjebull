import HomeScreen from './HomeScreen';
import pkg from '../package.json';

export default function HomePage() {
  return <HomeScreen version={pkg.version} />;
}
