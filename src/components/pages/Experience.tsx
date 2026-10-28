import { QuestLog } from '@/components/QuestLog';

export function Experience() {
  return (
    <div className="wrap">
      <header className="page-head glass" data-s>
        <h2 id="page-experience-title">Опыт</h2>
        <p>8 лет, 6 глав и ни одного «у меня всё работает»</p>
      </header>
      <QuestLog />
    </div>
  );
}
