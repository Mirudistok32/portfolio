import { JsonLd } from '@/components/JsonLd';
import { About } from '@/components/pages/About';
import { Contacts } from '@/components/pages/Contacts';
import { Experience } from '@/components/pages/Experience';
import { Shell } from '@/components/Shell';

export default function Home() {
  return (
    <>
      <JsonLd />
      <Shell
        pages={[
          <About key="about" />,
          <Experience key="experience" />,
          <Contacts key="contacts" />,
        ]}
      />
    </>
  );
}
