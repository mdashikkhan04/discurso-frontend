import React from "react";
import PlayerTag from "@/components/negotiation/PlayerTag";

function CasePanelComponent({ acase, ownTeam, enemy, vsAI, user }) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {enemy && (
        <div className="flex md:flex-row flex-col items-center md:flex-nowrap flex-wrap justify-between gap-4 flex-shrink-0">
          <PlayerTag
            sideName={ownTeam.sideName}
            vsAI={vsAI}
            isPrimary={true}
            emails={ownTeam?.participants?.map(
              (participant) => participant.email
            )}
          />
          <span className="font-semibold text-center md:w-fit w-full">VS</span>
          <PlayerTag
            sideName={enemy.team.sideName}
            vsAI={vsAI}
            isPrimary={false}
            emails={enemy?.participants?.map(
              (participant) => participant.email
            )}
          />
        </div>
      )}
      {acase && (
        <div className="flex-1 px-2 mt-6 overflow-y-auto lg:border-2 lg:border-soft-gray selection:bg-transparent rounded-2xl">
          <h2 className="text-xl font-semibold mt-2 text-center">
            {acase.caseTitle}
          </h2>
          <p className="text-gray-800 mb-4 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: acase.generalInstructions,
            }}
          />
          {acase.partyInstructions?.length && (
            <>
              <h3
                className={`text-lg font-semibold mb-2 text-red-700 ${acase.generalInstructions?.length ? "mt-4" : ""
                  }`}
              >
                Confidential instructions for {ownTeam.sideName}:
              </h3>
              <p
                className="text-gray-800 mb-6 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: acase.partyInstructions,
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(
  CasePanelComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.acase === nextProps.acase &&
      prevProps.ownTeam === nextProps.ownTeam &&
      prevProps.enemy === nextProps.enemy &&
      prevProps.vsAI === nextProps.vsAI &&
      prevProps.user === nextProps.user
    );
  }
);