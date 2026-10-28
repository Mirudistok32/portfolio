import { ContactLinks, HrCard } from '@/components/ContactCards';

export function Contacts() {
  return (
    <div className="wrap contact">
      <div className="contact-main">
        <header className="page-head glass" data-s>
          <h2 id="page-contacts-title">Давайте поговорим</h2>
          <p>Отвечаю в течение дня. На интересную задачу быстрее.</p>
        </header>
        <ContactLinks id="contacts" />
      </div>
      <HrCard id="hr" heading="h3" />
    </div>
  );
}
