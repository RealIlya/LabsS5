import {
  TERRAIN_RULES,
  type TerrainType,
  UNIT_RULES,
  type UnitType,
  STRUCTURE_RULES,
  type StructureType,
} from "@hex/shared";
import { translations } from "../../../shared/i18n";
import "./OverviewPage.css";

type DisplayMeta = {
  name: string;
  emoji: string;
  color: string;
  tagline: string;
};

const terrainMeta: Record<TerrainType, DisplayMeta> = {
  Plains: {
    name: "Равнина",
    emoji: "🟩",
    color: "#9bd770",
    tagline: "Главная магистраль",
  },
  Forest: {
    name: "Лес",
    emoji: "🌲",
    color: "#5d9c59",
    tagline: "Укрытие и засады",
  },
  Hills: {
    name: "Холмы",
    emoji: "⛰️",
    color: "#c3a572",
    tagline: "Высота и обзор",
  },
  Mountains: {
    name: "Горы",
    emoji: "🏔️",
    color: "#8d99ae",
    tagline: "Непроходимый барьер",
  },
  Water: {
    name: "Вода",
    emoji: "🌊",
    color: "#7ec8e3",
    tagline: "Отделяет континенты",
  },
};

const structureMeta: Record<StructureType, DisplayMeta> = {
  City: {
    name: "Город",
    emoji: "🏙️",
    color: "#f7a072",
    tagline: "Рост населения",
  },
  Barracks: {
    name: "Казармы",
    emoji: "🛡️",
    color: "#d97706",
    tagline: "Ветеранские войска",
  },
  Granary: {
    name: "Амбар",
    emoji: "🌾",
    color: "#deb887",
    tagline: "Прирост населения",
  },
  Farm: {
    name: "Ферма",
    emoji: "🚜",
    color: "#c0f17a",
    tagline: "Лимит империи",
  },
  Fort: {
    name: "Форт",
    emoji: "🏰",
    color: "#9aa0a6",
    tagline: "Контроль проходов",
  },
};

const unitMeta: Record<UnitType, DisplayMeta> = {
  Warrior: {
    name: "Воин",
    emoji: "⚔️",
    color: "#f4845f",
    tagline: "Универсальный солдат",
  },
  Spearman: {
    name: "Копейщик",
    emoji: "🛡️",
    color: "#9ca777",
    tagline: "Блокирует кавалерию",
  },
  Archer: {
    name: "Лучник",
    emoji: "🏹",
    color: "#8e8ffa",
    tagline: "Стреляет с дальности",
  },
  Horseman: {
    name: "Всадник",
    emoji: "🐎",
    color: "#c08261",
    tagline: "Самый быстрый",
  },
  Settler: {
    name: "Поселенец",
    emoji: "🧳",
    color: "#f4d160",
    tagline: "Расширяет империю",
  },
  Worker: {
    name: "Рабочий",
    emoji: "🛠️",
    color: "#7dd87d",
    tagline: "Строит фермы и форты",
  },
};

type CardData = {
  id: string;
  meta: DisplayMeta;
  stats: { label: string; value: string }[];
};

const t = translations.ru.overview;

const terrainCards: CardData[] = (
  Object.keys(TERRAIN_RULES) as TerrainType[]
).map((type) => {
  const rule = TERRAIN_RULES[type];
  const meta = terrainMeta[type];
  return {
    id: type,
    meta,
    stats: [
      {
        label: t.movement,
        value:
          rule.movementCost === Number.POSITIVE_INFINITY
            ? "❌ непроходимо"
            : `${rule.movementCost}`,
      },
      {
        label: t.defense,
        value: `${Math.round(rule.defenseBonus * 100)}%`,
      },
    ],
  };
});

const structureCards: CardData[] = (
  Object.keys(STRUCTURE_RULES) as StructureType[]
).map((type) => {
  const rule = STRUCTURE_RULES[type];
  const meta = structureMeta[type];
  const stats: CardData["stats"] = [
    { label: t.cost, value: `${rule.cost || "—"}` },
    { label: t.production, value: `${rule.productionTurns} ходов` },
  ];

  if (rule.effects.basePopulationGrowth) {
    stats.push({
      label: t.growth,
      value: `+${rule.effects.basePopulationGrowth}/ход`,
    });
  }
  if (rule.effects.populationGrowthBonus) {
    stats.push({
      label: t.growthBonus,
      value: `+${rule.effects.populationGrowthBonus}`,
    });
  }
  if (rule.effects.empirePopulationCapIncrease) {
    stats.push({
      label: t.empireCap,
      value: `+${rule.effects.empirePopulationCapIncrease}`,
    });
  }
  if (rule.effects.garrisonDefenseBonus) {
    stats.push({
      label: t.garrison,
      value: `+${Math.round(rule.effects.garrisonDefenseBonus * 100)}%`,
    });
  }
  if (rule.effects.veteranBonus) {
    stats.push({
      label: t.veterans,
      value: `+${Math.round(rule.effects.veteranBonus.attack * 100)}% атаки`,
    });
  }
  if (rule.effects.hasZoneOfControl) {
    stats.push({ label: t.zoneControl, value: "⛔️ стоп ход" });
  }

  return { id: type, meta, stats };
});

const unitCards: CardData[] = (
  Object.keys(UNIT_RULES) as UnitType[]
).map((type) => {
  const rule = UNIT_RULES[type];
  const meta = unitMeta[type];
  const stats: CardData["stats"] = [
    { label: t.cost, value: `${rule.cost}` },
    { label: t.production, value: `${rule.productionTurns} ходов` },
    { label: t.attack, value: `${rule.baseStats.attack}` },
    { label: t.health, value: `${rule.baseStats.health}` },
    { label: t.movementPoints, value: `${rule.baseStats.movement}` },
  ];

  if (rule.abilities.range) {
    stats.push({ label: t.range, value: `${rule.abilities.range} тайла` });
  }
  if (rule.abilities.canBuildCity) {
    stats.push({ label: t.special, value: "🏙️ строит города" });
  }
  if (rule.abilities.canBuildStructures?.length) {
    stats.push({
      label: t.builds,
      value: rule.abilities.canBuildStructures.map((s) => structureMeta[s].name).join(", "),
    });
  }
  if (rule.abilities.bonusVs?.length) {
    stats.push({
      label: t.bonusVs,
      value: rule.abilities.bonusVs
        .map(
          (bonus) =>
            `${unitMeta[bonus.type].name} +${Math.round(
              (bonus.multiplier - 1) * 100
            )}%`
        )
        .join(", "),
    });
  }
  if (rule.abilities.canAttack === false) {
    stats.push({ label: t.special, value: t.cannotAttack });
  }

  return { id: type, meta, stats };
});

const Section = ({ title, cards }: { title: string; cards: CardData[] }) => (
  <section>
    <h2>{title}</h2>
    <div className="card-grid">
      {cards.map((card) => (
        <article
          key={card.id}
          className="info-card"
          style={{ backgroundColor: card.meta.color }}
        >
          <div className="info-card__header">
            <span className="info-card__emoji" aria-hidden>
              {card.meta.emoji}
            </span>
            <div>
              <h3>{card.meta.name}</h3>
              <p>{card.meta.tagline}</p>
            </div>
          </div>
          <ul>
            {card.stats.map((stat) => (
              <li key={`${card.id}-${stat.label}`}>
                <span>{stat.label}</span>
                <span>{stat.value}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  </section>
);

export function OverviewPage() {
  return (
    <div className="overview">
      <header>
        <p>🧠 HQ</p>
        <h1>Hex-командование</h1>
        <p>Снимок всех ключевых сущностей через цвета и эмодзи.</p>
      </header>
      <Section title={t.tiles} cards={terrainCards} />
      <Section title={t.structures} cards={structureCards} />
      <Section title={t.units} cards={unitCards} />
    </div>
  );
}

export default OverviewPage;
