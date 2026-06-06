/** Fallback news items — synced with workflow-mobile/constants/news.ts */
export interface NewsItem {
  id: string;
  tag: string;
  title: string;
  desc: string;
  image: string;
  date?: string;
}

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: "1",
    tag: "Wellness",
    title: "Оптимизируйте сон",
    desc: "Новые метрики показывают: сон на 15 мин раньше может повысить концентрацию на 20%.",
    image: "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=600",
    date: "",
  },
  {
    id: "2",
    tag: "Умный офис",
    title: "Экономия энергии",
    desc: "Ваши умные устройства экономят энергию, синхронизируясь с расписанием.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
    date: "",
  },
  {
    id: "3",
    tag: "Продуктивность",
    title: "Советы на день",
    desc: "Рекомендуем сделать перерыв через 45 минут работы.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600",
    date: "",
  },
  {
    id: "4",
    tag: "Wellness",
    title: "Утренняя зарядка",
    desc: "10 минут лёгкой зарядки утром повышают продуктивность на весь день.",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600",
    date: "",
  },
  {
    id: "5",
    tag: "Умный офис",
    title: "Автоматизация освещения",
    desc: "Настройте сценарии освещения под время суток для комфорта глаз.",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
    date: "",
  },
].map((item, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  return { ...item, date: d.toISOString().slice(0, 10) };
});
