import { Card, Spin } from "antd";
import styles from "./MenuPage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { JSX } from "react";
import type { CardItem } from "../../../types/HomePage";

type Props = {
    cards?: CardItem[];
    loading?: boolean;
    error?: string | null;
    onCardClick?: (link: string) => void;
};

const colorMap: Record<string, string> = {
    GreenSkin: "limegreen",
    Reskin: "yellowgreen",
    RedSkin: "crimson",
    BlueSkin: "deepskyblue",
    default: "coral",
};

export default function HomeCardView({ cards, loading, error, onCardClick }: Props): JSX.Element {
    if (loading) return <Spin tip="Chargement..." size="large" />;
    if (error) return <p style={{ color: "red" }}>Erreur: {error}</p>;
    if (!cards || cards.length === 0) return <p>Aucune carte.</p>;

    return (
        <div className={styles.gridContainer}>
            {cards.map((card, index) => {
                const iconColor = colorMap[card.Name] ?? colorMap.default;

                return (
                    <Card
                        key={index}
                        hoverable
                        onClick={() => onCardClick?.(card.Link)}
                        className={styles.card}
                        styles={{ body: { padding: 0 } }}
                    >
                        <div className={styles.cardIcon} style={{ color: iconColor }}>
                            <FontAwesomeIcon icon={card.Icon} />
                        </div>
                        <div className={styles.cardBody}>
                            <a>{card.Name}</a>
                            <p>{card.Description}</p>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}