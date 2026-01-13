"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ChatWindow from "./ChatWindow";

export default function PastRound({ round }) {
  const acase = round.case;
  const enemy = round.enemy;
  const ownTeam = round.ownTeam;
  const feedback = round.feedback;
  const feedbackLabels = round.feedbackLabels;
  const survey = round.survey;
  const vsAI = round.vsAI;
  const messages = round.messages;
  const madeDeal = round.results.madeDeal;
  const comment = round.results.comment;


  return (
    <div className={`grid grid-cols-1 gap-8 max-w-8xl mx-auto px-4 ${acase ? "lg:grid-cols-2" : "lg:grid-cols-1 justify-items-center"}`}>
      <div>
        {enemy && (
          <div>
            <h2 className="text-md mb-0">
              You represented <strong>{ownTeam.sideName}</strong>
              <br />
              In that round, you negotiated with <strong>{enemy.team.sideName}</strong>
            </h2>
          </div>
        )}
        {acase && (
          (feedback && feedbackLabels) ? (
            <div>
              <Accordion type="multiple" className="w-full" defaultValue={["feedback"]}>
                <AccordionItem value="case">
                  <AccordionTrigger >
                    <div className="text-lg">
                      <span className="font-semibold text-gray-700">Case</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div>
                      <p className="text-gray-800 mb-4 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: acase.generalInstructions }} />
                      {acase.partyInstructions?.length && (
                        <>
                          <h3 className={`text-lg font-semibold mb-2 text-red-700 ${acase.generalInstructions?.length ? "mt-4" : ""}`}>Confidential instructions for {ownTeam.sideName}:</h3>
                          <p className="text-gray-800 mb-6 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: acase.partyInstructions }} />
                        </>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="feedback">
                  <AccordionTrigger >
                    <div className="text-lg">
                      <span className="font-semibold  text-gray-700">Feedback</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="whitespace-pre-wrap">
                      <h1 className="text-xl font-semibold mb-2">Negotiation summary:</h1>
                      <p>{feedback.summary}</p>
                      <h1 className="text-lg font-semibold mt-4 mb-2">Performance criteria:</h1>
                      {Object.keys(feedbackLabels).map((label, index) => (
                        <div key={index} className="mb-2">
                          <h2 className="font-semibold">{feedbackLabels[label]} - {<span className="font-bold">{feedback.scores[label]}/5</span>}</h2>
                          <p>{feedback.reasoning[label]}</p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            <div>
              <p className="text-gray-800 mb-4 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: acase.generalInstructions }} />
              {acase.partyInstructions?.length && (
                <>
                  <h3 className={`text-lg font-semibold mb-2 text-red-700 ${acase.generalInstructions?.length ? "mt-4" : ""}`}>Confidential instructions for {ownTeam.sideName}:</h3>
                  <p className="text-gray-800 mb-6 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: acase.partyInstructions }} />
                </>
              )}
            </div>
          ))}
      </div>

      <div>
        {acase && (
          <Accordion type="multiple" className="w-full" defaultValue={["agreement", "messages"]}>
            <AccordionItem value="agreement">
              <AccordionTrigger >
                <span className="text-lg font-semibold text-gray-700">Agreement</span>
              </AccordionTrigger>
              <AccordionContent>
                {madeDeal ? (
                  <div>
                    {
                      acase.params &&
                      acase.params.map((param, index) => (
                        <div className="mb-4" key={param.name}>
                          <label className="block text-gray-600 mb-2">{param.name}</label>
                          <p className="font-semibold text-lg">{param.value}</p>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div>
                    <h3 className="text-2xl mt-2 mb-2 font-bold text-red-700">No deal</h3>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="questionnaire">
              <AccordionTrigger >
                <span className="text-lg font-semibold text-gray-700">Questionnaire</span>
              </AccordionTrigger>
              <AccordionContent>
                {survey.map((input) => (
                  <div key={input.fieldName} className="mb-8">
                    <div className="mb-4">
                      <label className="block text-gray-600 mb-1">
                        {input.label}
                      </label>
                      {input.value && (
                        <p className="whitespace-pre-wrap"><span className="font-semibold text-lg">{input.value}</span>  (1 - {input.minDesc}, 7 - {input.maxDesc})</p>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-2">
                  <label className="block text-gray-800 mb-2">Comment</label>
                  <div className="border-2 rounded-lg border-gray-100">
                    <textarea
                      value={comment}
                      className="w-full p-2"
                      disabled={true}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {vsAI && (
              <AccordionItem value="messages">
                <AccordionTrigger >
                  <span className="text-lg font-semibold text-gray-700">Messages</span>
                </AccordionTrigger>
                <AccordionContent>
                  <ChatWindow initialMessages={messages} acase={acase} viewOnly={true} />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </div>
    </div>

  );
}
