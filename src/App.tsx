import {
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import rawCards from "../data/cards.json";
import {
  ALL_FILTER_VALUE,
  CheckedFilter,
  MissableFilter,
  SortField,
  useCardFiltersStore
} from "./store/useCardFiltersStore";
import "./App.css";

type Card = {
  deck: string;
  details: string;
  expansion: string;
  name: string;
  territory: string;
  type: string;
};

type MissableRisk = "safe" | "caution" | "missable";
type DeckTone =
  | "neutral"
  | "monsters"
  | "northern"
  | "nilfgaard"
  | "skellige"
  | "scoiatael";
type MissableIntel = {
  risk: MissableRisk;
  reason: string;
  action: string;
  cutoff: string;
};

type CardRow = Card & { id: string; intel: MissableIntel };

const COLLECTION_STORAGE_KEY = "gwent-collected-v1";

const RISK_ORDER: Record<MissableRisk, number> = {
  safe: 0,
  caution: 1,
  missable: 2
};

function buildMissableIntel(card: Card): MissableIntel {
  const details = card.details.toLowerCase();
  const sourceType = card.type.toLowerCase();

  if (details.includes("high stakes")) {
    return {
      risk: "missable",
      reason: "Tournament knockout means the card is lost for this playthrough.",
      action: "Manual save before every Passiflora match and reload on loss.",
      cutoff: "During High Stakes"
    };
  }

  if (details.includes("a matter of life and death")) {
    return {
      risk: "missable",
      reason: "Card games at the Vegelbud party are a one-time quest window.",
      action: "Play all three opponents during the party sequence.",
      cutoff: "While A Matter of Life and Death is active"
    };
  }

  if (details.includes("a dangerous game")) {
    return {
      risk: "caution",
      reason: "Primary route is quest-dependent; fallback loot exists but is easy to miss.",
      action: "Finish A Dangerous Game early and keep cards over crowns.",
      cutoff: "Before Isle of Mists (recommended)"
    };
  }

  if (
    details.includes("old pals") ||
    details.includes("play thaler") ||
    details.includes("lambert") ||
    details.includes("bloody baron") ||
    details.includes("kingfisher inn") ||
    details.includes("madman lugos") ||
    details.includes("on thin ice")
  ) {
    return {
      risk: "caution",
      reason:
        "Opponent/quest state can move or lock this match if delayed too far.",
      action: "Prioritize this Gwent questline before late-story progression.",
      cutoff: "Before Isle of Mists / On Thin Ice triggers"
    };
  }

  if (details.includes("or search") || details.includes("or automatically received")) {
    return {
      risk: "caution",
      reason: "Card has fallback placement, usually after an opponent becomes unavailable.",
      action:
        "Complete normally when possible, then use objective/search fallback if needed.",
      cutoff: "Quest progression dependent"
    };
  }

  if (sourceType.includes("secondary quest")) {
    return {
      risk: "caution",
      reason: "Secondary quest cards can be skipped if related questlines are ignored.",
      action: "Do the quest as soon as it unlocks and keep a rolling manual save.",
      cutoff: "Before major story lock points"
    };
  }

  if (sourceType.includes("gwent quest")) {
    return {
      risk: "caution",
      reason: "Gwent quest cards are usually safe, but tied to specific opponents/timing.",
      action: "Clear each regional Gwent chain when it appears.",
      cutoff: "Before Isle of Mists (recommended)"
    };
  }

  return {
    risk: "safe",
    reason: "No known one-way lockout from current guide rules.",
    action: "Collect whenever convenient.",
    cutoff: "No hard cutoff"
  };
}

const cards: CardRow[] = (rawCards as Card[]).map((card, index) => ({
  ...card,
  id: String(index),
  intel: buildMissableIntel(card)
}));

function uniqueValues(field: keyof Card) {
  return Array.from(new Set(cards.map((card) => card[field]))).sort((a, b) =>
    a.localeCompare(b)
  );
}

const deckOptions = uniqueValues("deck").sort((a, b) => a.localeCompare(b));
const expansionOptions = uniqueValues("expansion");
const territoryOptions = uniqueValues("territory");
const typeOptions = uniqueValues("type");

function matches(value: string, selected: string) {
  return selected === ALL_FILTER_VALUE || value === selected;
}

function riskLabel(risk: MissableRisk) {
  if (risk === "missable") return "Missable";
  if (risk === "caution") return "Quest-Sensitive";
  return "Safe";
}

function deckTone(deck: string): DeckTone {
  const value = deck.toLowerCase();

  if (value.includes("monster")) return "monsters";
  if (value.includes("northern")) return "northern";
  if (value.includes("nilfgaard")) return "nilfgaard";
  if (value.includes("skellige")) return "skellige";
  if (value.includes("scoia")) return "scoiatael";

  return "neutral";
}

function deckTableLabel(deck: string) {
  return deck === "Northern Realms" ? "Realms" : deck;
}

function loadCollectedSet() {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const stored = window.localStorage.getItem(COLLECTION_STORAGE_KEY);
    if (!stored) return new Set<string>();

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return new Set<string>();

    const validIds = new Set(cards.map((card) => card.id));
    const valid = parsed.filter(
      (id): id is string => typeof id === "string" && validIds.has(id)
    );

    return new Set(valid);
  } catch {
    return new Set<string>();
  }
}

function App() {
  const search = useCardFiltersStore((state) => state.search);
  const deck = useCardFiltersStore((state) => state.deck);
  const expansion = useCardFiltersStore((state) => state.expansion);
  const territory = useCardFiltersStore((state) => state.territory);
  const cardType = useCardFiltersStore((state) => state.cardType);
  const missableFilter = useCardFiltersStore((state) => state.missableFilter);
  const checkedFilter = useCardFiltersStore((state) => state.checkedFilter);
  const sortField = useCardFiltersStore((state) => state.sortField);
  const sortDirection = useCardFiltersStore((state) => state.sortDirection);
  const setSearch = useCardFiltersStore((state) => state.setSearch);
  const setDeck = useCardFiltersStore((state) => state.setDeck);
  const setExpansion = useCardFiltersStore((state) => state.setExpansion);
  const setTerritory = useCardFiltersStore((state) => state.setTerritory);
  const setCardType = useCardFiltersStore((state) => state.setCardType);
  const setMissableFilter = useCardFiltersStore(
    (state) => state.setMissableFilter
  );
  const setCheckedFilter = useCardFiltersStore((state) => state.setCheckedFilter);
  const clearFilters = useCardFiltersStore((state) => state.clearFilters);
  const toggleSort = useCardFiltersStore((state) => state.toggleSort);

  const [checkedRows, setCheckedRows] = useState<Set<string>>(loadCollectedSet);
  const masterCheckRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      COLLECTION_STORAGE_KEY,
      JSON.stringify([...checkedRows])
    );
  }, [checkedRows]);

  const filteredCards = useMemo(() => {
    const queryParts = search
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const result = cards.filter((card) => {
      if (!matches(card.deck, deck)) return false;
      if (!matches(card.expansion, expansion)) return false;
      if (!matches(card.territory, territory)) return false;
      if (!matches(card.type, cardType)) return false;
      if (missableFilter !== "all" && card.intel.risk !== missableFilter) {
        return false;
      }

      const isChecked = checkedRows.has(card.id);
      if (checkedFilter === "checked" && !isChecked) return false;
      if (checkedFilter === "unchecked" && isChecked) return false;

      if (!queryParts.length) return true;

      const searchable = [
        card.name,
        card.details,
        card.deck,
        card.expansion,
        card.territory,
        card.type,
        card.intel.reason,
        card.intel.action,
        card.intel.cutoff
      ]
        .join(" ")
        .toLowerCase();

      return queryParts.every((part) => searchable.includes(part));
    });

    result.sort((a, b) => {
      if (sortField === "collected") {
        const left = checkedRows.has(a.id) ? 1 : 0;
        const right = checkedRows.has(b.id) ? 1 : 0;

        if (left !== right) {
          return sortDirection === "asc" ? left - right : right - left;
        }

        return a.name.localeCompare(b.name);
      }

      if (sortField === "risk") {
        const left = RISK_ORDER[a.intel.risk];
        const right = RISK_ORDER[b.intel.risk];
        if (left !== right) {
          return sortDirection === "asc" ? left - right : right - left;
        }
        return a.name.localeCompare(b.name);
      }

      const left = a[sortField];
      const right = b[sortField];
      const order = left.localeCompare(right);
      if (order !== 0) return sortDirection === "asc" ? order : -order;

      return a.name.localeCompare(b.name);
    });

    return result;
  }, [
    search,
    deck,
    expansion,
    territory,
    cardType,
    missableFilter,
    checkedFilter,
    checkedRows,
    sortField,
    sortDirection
  ]);

  const totalCards = cards.length;
  const collectedCount = checkedRows.size;
  const missingCount = totalCards - collectedCount;
  const collectedPercent = totalCards
    ? Math.round((collectedCount / totalCards) * 100)
    : 0;
  const missableCards = cards.filter((card) => card.intel.risk === "missable");
  const cautionCards = cards.filter((card) => card.intel.risk === "caution");
  const missableRemaining = missableCards.filter(
    (card) => !checkedRows.has(card.id)
  ).length;
  const cautionRemaining = cautionCards.filter(
    (card) => !checkedRows.has(card.id)
  ).length;

  const visibleCheckedCount = filteredCards.filter((card) =>
    checkedRows.has(card.id)
  ).length;
  const visiblePercent = filteredCards.length
    ? Math.round((visibleCheckedCount / filteredCards.length) * 100)
    : 0;
  const allVisibleChecked =
    filteredCards.length > 0 && visibleCheckedCount === filteredCards.length;
  const someVisibleChecked = visibleCheckedCount > 0 && !allVisibleChecked;

  useEffect(() => {
    if (!masterCheckRef.current) return;
    masterCheckRef.current.indeterminate = someVisibleChecked;
  }, [someVisibleChecked]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    deck !== ALL_FILTER_VALUE ||
    expansion !== ALL_FILTER_VALUE ||
    territory !== ALL_FILTER_VALUE ||
    cardType !== ALL_FILTER_VALUE ||
    missableFilter !== "all" ||
    checkedFilter !== "all";

  const deckProgress = useMemo(() => {
    const progress = new Map<string, { total: number; collected: number }>();

    for (const card of cards) {
      if (!progress.has(card.deck)) {
        progress.set(card.deck, { total: 0, collected: 0 });
      }
      const current = progress.get(card.deck)!;
      current.total += 1;
      if (checkedRows.has(card.id)) current.collected += 1;
    }

    return [...progress.entries()]
      .map(([name, values]) => ({
        deck: name,
        total: values.total,
        collected: values.collected,
        percent: values.total
          ? Math.round((values.collected / values.total) * 100)
          : 0
      }))
      .sort((a, b) => {
        const aNeutral = a.deck.toLowerCase() === "neutral" ? 0 : 1;
        const bNeutral = b.deck.toLowerCase() === "neutral" ? 0 : 1;
        if (aNeutral !== bNeutral) return aNeutral - bNeutral;

        return b.percent - a.percent || a.deck.localeCompare(b.deck);
      });
  }, [checkedRows]);

  const toggleRow = (id: string) => {
    setCheckedRows((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setVisibleChecked = (value: boolean) => {
    setCheckedRows((previous) => {
      const next = new Set(previous);
      for (const card of filteredCards) {
        if (value) next.add(card.id);
        else next.delete(card.id);
      }
      return next;
    });
  };

  const sortIcon = (field: SortField) => {
    if (field !== sortField) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const meterStyle = { "--progress": collectedPercent } as CSSProperties;

  return (
    <main className="appShell">
      <header className="hero cardSurface rise">
        <div className="heroCopy">
          <p className="eyebrow">Gwent Collection Vault</p>
          <h1>Collected {collectedCount} of {totalCards} cards</h1>
          <p className="heroDescription">
            Track every card, filter instantly, and focus on what is still
            missing. All filters and interactions run client-side in memory.
          </p>

          <div className="heroMetrics">
            <article className="metricTile">
              <span>Completion</span>
              <strong>{collectedPercent}%</strong>
              <small>{missingCount} cards remaining</small>
            </article>
            <article className="metricTile">
              <span>Visible Now</span>
              <strong>{filteredCards.length}</strong>
              <small>
                {visibleCheckedCount} collected ({visiblePercent}%)
              </small>
            </article>
            <article className="metricTile">
              <span>Filter State</span>
              <strong>{hasActiveFilters ? "Focused" : "All Cards"}</strong>
              <small>
                {hasActiveFilters
                  ? "Filters are actively narrowing results"
                  : "No filter constraints"}
              </small>
            </article>
            <article className="metricTile">
              <span>Critical Missables Left</span>
              <strong>{missableRemaining}</strong>
              <small>
                {cautionRemaining} quest-sensitive cards still uncollected
              </small>
            </article>
          </div>
        </div>

        <aside className="heroMeter">
          <div className="meterRing" style={meterStyle}>
            <div className="meterInner">
              <span className="meterLabel">Collected</span>
              <strong>{collectedPercent}%</strong>
              <small>
                {collectedCount}/{totalCards}
              </small>
            </div>
          </div>
        </aside>
      </header>

      <section className="filterPanel cardSurface rise delay1">
        <div className="filterHeader">
          <h2>Filter and Focus</h2>
          <p>Search all cards and apply precise filters without round trips.</p>
        </div>

        <div className="filters">
          <label>
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, details, deck, location..."
            />
          </label>

          <label>
            Deck
            <select value={deck} onChange={(event) => setDeck(event.target.value)}>
              <option>{ALL_FILTER_VALUE}</option>
              {deckOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Expansion
            <select
              value={expansion}
              onChange={(event) => setExpansion(event.target.value)}
            >
              <option>{ALL_FILTER_VALUE}</option>
              {expansionOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Territory
            <select
              value={territory}
              onChange={(event) => setTerritory(event.target.value)}
            >
              <option>{ALL_FILTER_VALUE}</option>
              {territoryOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Source Type
            <select
              value={cardType}
              onChange={(event) => setCardType(event.target.value)}
            >
              <option>{ALL_FILTER_VALUE}</option>
              {typeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <label>
            Missable Risk
            <select
              value={missableFilter}
              onChange={(event) =>
                setMissableFilter(event.target.value as MissableFilter)
              }
            >
              <option value="all">All</option>
              <option value="safe">Safe</option>
              <option value="caution">Quest-Sensitive</option>
              <option value="missable">Missable</option>
            </select>
          </label>

          <label>
            Collection Status
            <select
              value={checkedFilter}
              onChange={(event) =>
                setCheckedFilter(event.target.value as CheckedFilter)
              }
            >
              <option value="all">All</option>
              <option value="checked">Collected only</option>
              <option value="unchecked">Missing only</option>
            </select>
          </label>
        </div>

        <div className="quickActions">
          <button
            type="button"
            className="actionButton actionPrimary"
            onClick={() => setCheckedFilter("unchecked")}
          >
            Show Missing Only
          </button>
          <button
            type="button"
            className="actionButton"
            onClick={() => setCheckedFilter("checked")}
          >
            Show Collected Only
          </button>
          <button
            type="button"
            className="actionButton"
            onClick={() => setMissableFilter("missable")}
          >
            Show Missables Only
          </button>
          <button type="button" className="actionButton" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        <div className="missableGuide">
          <h3>Missable Playbook</h3>
          <p>
            Most cards are safe. Focus on the high-risk cards and clear quest
            chains before story lock points.
          </p>
          <ul>
            <li>
              Save before every <strong>High Stakes</strong> round at Passiflora.
            </li>
            <li>
              Finish all three games during <strong>A Matter of Life and Death</strong>.
            </li>
            <li>
              Clear quest-based Gwent lines before <strong>Isle of Mists</strong>.
            </li>
          </ul>
        </div>

        {hasActiveFilters ? (
          <div className="activeChips">
            {search.trim() && (
              <button type="button" onClick={() => setSearch("")}>
                Search: "{search.trim()}" ×
              </button>
            )}
            {deck !== ALL_FILTER_VALUE && (
              <button type="button" onClick={() => setDeck(ALL_FILTER_VALUE)}>
                Deck: {deck} ×
              </button>
            )}
            {expansion !== ALL_FILTER_VALUE && (
              <button
                type="button"
                onClick={() => setExpansion(ALL_FILTER_VALUE)}
              >
                Expansion: {expansion} ×
              </button>
            )}
            {territory !== ALL_FILTER_VALUE && (
              <button
                type="button"
                onClick={() => setTerritory(ALL_FILTER_VALUE)}
              >
                Territory: {territory} ×
              </button>
            )}
            {cardType !== ALL_FILTER_VALUE && (
              <button type="button" onClick={() => setCardType(ALL_FILTER_VALUE)}>
                Type: {cardType} ×
              </button>
            )}
            {missableFilter !== "all" && (
              <button type="button" onClick={() => setMissableFilter("all")}>
                Risk: {riskLabel(missableFilter)} ×
              </button>
            )}
            {checkedFilter !== "all" && (
              <button type="button" onClick={() => setCheckedFilter("all")}>
                Status:{" "}
                {checkedFilter === "checked" ? "Collected" : "Missing"} ×
              </button>
            )}
          </div>
        ) : null}
      </section>

      <section className="deckPanel cardSurface rise delay2">
        <div className="deckPanelHeader">
          <h2>Deck Completion</h2>
          <p>See collection progress split by faction deck.</p>
        </div>
        <div className="deckGrid">
          {deckProgress.map((entry) => (
            <article
              key={entry.deck}
              className={`deckCard tone-${deckTone(entry.deck)}`}
            >
              <header>
                <h3>{entry.deck}</h3>
                <span>{entry.percent}%</span>
              </header>
              <p>
                {entry.collected}/{entry.total} collected
              </p>
              <div className="barTrack">
                <span style={{ width: `${entry.percent}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="tablePanel cardSurface rise delay3">
        <div className="tablePanelHeader">
          <div>
            <h2>Card Registry</h2>
            <p>
              Showing {filteredCards.length} cards, {visibleCheckedCount}{" "}
              collected in this view. {missableRemaining} high-risk cards remain
              overall.
            </p>
          </div>
          <div className="tableActions">
            <button
              type="button"
              className="actionButton actionPrimary"
              onClick={() => setVisibleChecked(true)}
              disabled={filteredCards.length === 0}
            >
              Check Visible
            </button>
            <button
              type="button"
              className="actionButton"
              onClick={() => setVisibleChecked(false)}
              disabled={filteredCards.length === 0}
            >
              Uncheck Visible
            </button>
            <button
              type="button"
              className="actionButton"
              onClick={() => setCheckedRows(new Set())}
              disabled={!checkedRows.size}
            >
              Reset Collection
            </button>
          </div>
        </div>

        <p className="tableSwipeHint">
          On phones, swipe the table sideways to view additional columns.
        </p>

        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th className="checkColumn stickyLeft">
                  <input
                    ref={masterCheckRef}
                    type="checkbox"
                    aria-label="Toggle all visible rows"
                    checked={allVisibleChecked}
                    onChange={(event) => setVisibleChecked(event.target.checked)}
                  />
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("collected")}>
                    Collected {sortIcon("collected")}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("name")}>
                    Name {sortIcon("name")}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("deck")}>
                    Deck {sortIcon("deck")}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("expansion")}>
                    Expansion {sortIcon("expansion")}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("territory")}>
                    Territory {sortIcon("territory")}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("type")}>
                    Type {sortIcon("type")}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("risk")}>
                    Missable Intel {sortIcon("risk")}
                  </button>
                </th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.length === 0 ? (
                <tr>
                  <td className="empty" colSpan={9}>
                    No cards match the current filters.
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => {
                  const isChecked = checkedRows.has(card.id);
                  const label = riskLabel(card.intel.risk);
                  return (
                    <tr key={card.id} className={isChecked ? "rowCollected" : ""}>
                      <td className="checkColumn stickyLeft">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRow(card.id)}
                          aria-label={`Toggle ${card.name}`}
                        />
                      </td>
                      <td>
                        <span
                          className={isChecked ? "statusTag done" : "statusTag todo"}
                        >
                          {isChecked ? "Collected" : "Missing"}
                        </span>
                      </td>
                      <td className="nameCell">{card.name}</td>
                      <td>
                        <span
                          className={`deckBadge tone-${deckTone(card.deck)}`}
                          title={card.deck}
                        >
                          {deckTableLabel(card.deck)}
                        </span>
                      </td>
                      <td>{card.expansion}</td>
                      <td>{card.territory}</td>
                      <td>{card.type}</td>
                      <td className="riskCell">
                        <span className={`riskBadge ${card.intel.risk}`}>
                          {label}
                        </span>
                        {card.intel.risk !== "safe" ? (
                          <small>{card.intel.reason}</small>
                        ) : (
                          <small>Not currently known to hard-lock.</small>
                        )}
                      </td>
                      <td className="details">
                        <p className="detailMain">{card.details}</p>
                        {card.intel.risk !== "safe" ? (
                          <p className="detailHint">
                            Tip: {card.intel.action} Cutoff: {card.intel.cutoff}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default App;
