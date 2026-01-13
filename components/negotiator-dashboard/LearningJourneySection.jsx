"use client";

import React, { useEffect, useState } from "react";
import LearningJourneyCard from "./LearningJourneyCard";
import { getRecommendation } from "@/actions/journey";

const competencyGroupMappings = [
  {
    categoryName: "Emotionality and Language",
    tags: [
      "quality_of_expression",
      "active_listening_and_questioning",
      "managing_emotions",
    ],
    bgColor: "#EFFFED",
    accentColor: "#34DE21",
    thirdColor: "#0d8000b4",
    iconIndex: 1,
  },
  {
    categoryName: "Negotiation Intelligence",
    tags: [
      "understanding_interests_and_options",
      "setting_the_stage",
      "making_the_first_offer",
      "managing_concessions",
      "searching_for_trade-offs",
      "generating_creative_options",
      "using_objective_criteria",
      "post-settlement_settlements",
      "strategic_adaptability",
    ],
    bgColor: "#FFEAEA",
    accentColor: "#DE2121",
    thirdColor: "#d61a1acb",
    iconIndex: 2,
  },
  {
    categoryName: "Trust and Relationship Building",
    tags: ["trust_and_relationship_building"],
    bgColor: "#FFFFDD",
    accentColor: "#E5E513",
    thirdColor: "#777700c7",
    iconIndex: 3,
  },
  {
    categoryName: "Moral Wisdom",
    tags: ["ethics", "empathy"],
    bgColor: "#FAE4FF",
    accentColor: "#CB6DE1",
    thirdColor: "#a74cbec2",
    iconIndex: 4,
  },
];

const defaultGroupDetails = {
  categoryName: "General Learning Journey",
  bgColor: "#F9FAFB",
  accentColor: "#0A77FF",
  thirdColor: "#004499",
  iconIndex: 5,
};

const LearningJourneySection = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCompetencyGroupDetails = (tags) => {
    if (!tags || tags.length === 0) {
      return defaultGroupDetails;
    }

    for (const group of competencyGroupMappings) {
      const hasMatchingTag = tags.some((tag) => group.tags.includes(tag));
      if (hasMatchingTag) {
        return {
          categoryName: group.categoryName,
          bgColor: group.bgColor,
          accentColor: group.accentColor,
          thirdColor: group.thirdColor,
          iconIndex: group.iconIndex,
        };
      }
    }

    return defaultGroupDetails;
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await getRecommendation();

        const mapped = data.map((item) => {
          const resource = item.resourceDoc || {};
          const itemTags = item.tags || resource.tags || [];

          const groupDetails = getCompetencyGroupDetails(itemTags);

          return {
            bgColor: groupDetails.bgColor,
            accentColor: groupDetails.accentColor,
            thirdColor: groupDetails.thirdColor,
            icon: `/negotiator-dashboard/LJ${groupDetails.iconIndex}.png`,
            title: item.title || resource.title || groupDetails.categoryName || "Untitled",
            description: item.description || resource.description || "No description available",
            progress: item.progress || 0,
            link: resource.id ? `/journey?resource=${resource.id}` : "#",
          };
        });

        setCards(mapped);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return <div>Loading learning journey...</div>;
  if (!cards.length) return <div>No recommendations available.</div>;

  return (
    <section className="w-full mt-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <LearningJourneyCard key={index} {...card} />
        ))}
      </div>
    </section>
  );
};

export default LearningJourneySection;