import { ContactLinks, HrCard } from '@/components/ContactCards';

export function Contacts() {
  return (
    <div className="wrap contact">
      <div className="contact-main">
        <header className="page-head glass" data-s>
          <h2 id="page-contacts-title">Давайте поговорим</h2>
          <p>
            На связи с 10:00 до 19:00 по Москве. Отвечаю в течение дня, на интересную задачу
            быстрее.
          </p>
        </header>
        <ContactLinks id="contacts" />
      </div>
      <HrCard id="hr" heading="h3" />
    </div>
  );
}
