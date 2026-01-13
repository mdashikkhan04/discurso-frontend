import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import InfoTooltip from "@/components/InfoTooltip";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";

export default function AgreementPanel({
  acase,
  handleParamChange,
  isAgreementFinal,
  finished,
  handleAgreementSubmit,
  dataTypeTips,
  agreements = [],
  conflicts = [],
  enemyIds = [],
  ownTeamIds = [],
  vsAI = true,
  stats = {},
  requiresSVI,
  isInAppChat = true,
  hasExistingTranscript = false,
  checkingTranscript = false,
  onUploadTranscript,
}) {
  const agreemenBottomtRef = useRef(null);
  const lastAppliedAgreementRef = useRef(null);

  const showP2PStatus = !vsAI && !isAgreementFinal && !finished;
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [ownAgreementState, setOwnAgreementState] = useState(null);
  const [enemyAgreementState, setEnemyAgreementState] = useState(null);


  // Check if content overflows and show scroll indicator
  useEffect(() => {
    const checkOverflow = () => {
      if (agreemenBottomtRef.current) {
        const element = agreemenBottomtRef.current;
        const hasOverflow = element.scrollHeight > element.clientHeight;
        setShowScrollIndicator(hasOverflow);
      }
    };

    checkOverflow();

    // Check on window resize
    window.addEventListener("resize", checkOverflow);

    // Check when content changes
    const observer = new ResizeObserver(checkOverflow);
    if (agreemenBottomtRef.current) {
      observer.observe(agreemenBottomtRef.current);
    }

    return () => {
      window.removeEventListener("resize", checkOverflow);
      observer.disconnect();
    };
  }, [stats?.offer]);

  useEffect(() => {
    const ownAgreement = agreements.find(agreement =>
      agreement.participants &&
      agreement.participants.some(pid => ownTeamIds.includes(pid))
    );
    const enemyAgreement = agreements.find(agreement =>
      agreement.participants &&
      agreement.participants.some(pid => enemyIds.includes(pid))
    );
    setOwnAgreementState(ownAgreement);
    setEnemyAgreementState(enemyAgreement);
  }, [agreements, ownTeamIds, enemyIds]);

  const hasOwnAgreement = ownAgreementState && Object.keys(ownAgreementState.agreement || {}).length > 0;
  const hasEnemyAgreementData = enemyAgreementState && Object.keys(enemyAgreementState.agreement || {}).length > 0;

  const getAgreementStatus = () => {
    if (!showP2PStatus) return null;

    if (hasOwnAgreement && hasEnemyAgreementData) {
      if (conflicts.length > 0) {
        return "conflict";
      } else {
        return "match";
      }
    } else if (hasOwnAgreement && !hasEnemyAgreementData) {
      return "waiting";
    } else if (!hasOwnAgreement && hasEnemyAgreementData) {
      return "enemy_submitted";
    } else {
      return "none";
    }
  };

  useEffect(() => {
    const incoming = ownAgreementState?.agreement;
    if (!acase?.params || !incoming) return;

    const incomingJson = JSON.stringify(incoming);
    if (lastAppliedAgreementRef.current === incomingJson) return;

    const updates = [];
    acase.params.forEach((param) => {
      const agreedValue = incoming[param.id];
      if (agreedValue !== undefined && agreedValue !== param.value) {
        updates.push({ id: param.id, value: agreedValue, dataType: param.dataType });
      }
    });

    if (updates.length) {
      updates.forEach((u) => handleParamChange(u.id, u.value, u.dataType));
      lastAppliedAgreementRef.current = incomingJson;
    }
  }, [agreements]);
  

  // useEffect(() => {
  //   console.log(vsAI, requiresSVI)
  // }, [vsAI, requiresSVI])

  const agreementStatus = getAgreementStatus();

  return (vsAI && !isAgreementFinal) ? <>
    {stats.offer?.length > 0 ? (
      <div ref={agreemenBottomtRef} className="bg-white p-2 mb-2 h-full overflow-y-auto">
        {showScrollIndicator && <p className="text-gray-500 text-center my-2 text-sm">
          This box is scrollable, scroll down or resize to see the full offer
        </p>}
        <p className="text-blue-900 font-semibold text-center">
          {isAgreementFinal ? "Settled" : "Latest"} offer:
        </p>
        {stats.offer.map((param, i) => (
          <div key={i}>
            <p className="text-gray-800">
              {acase.scorable ? "-" + param.name + ": " : ""}
              <strong>{param.value}</strong>
            </p>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-white p-2 mb-2 h-full overflow-y-auto flex items-center justify-center">
        <p className="text-blue-900 font-semibold text-lg text-center">No offer yet</p>
      </div>
    )}
  </> : (
    <div className="w-full h-full flex flex-col">
      {/* P2P Status Badge */}
      {showP2PStatus && (
        <div className="p-3 rounded-lg border">
          {agreementStatus === "conflict" && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-center">Agreement Conflict Detected</Badge>
              <span className="text-sm text-gray-600">
                Your agreements don't match. Please coordinate and resubmit.
              </span>
            </div>
          )}
          {agreementStatus === "match" && (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500 text-center">Agreements Match!</Badge>
              <span className="text-sm text-gray-600">
                Both parties have submitted matching agreements.
              </span>
            </div>
          )}
          {agreementStatus === "waiting" && (
            <div className="flex items-center gap-2">
              <Badge className={"text-center"} variant="secondary">Waiting for Other Party</Badge>
              <span className="text-sm text-gray-600">
                You have submitted your agreement. Waiting for the other party.
              </span>
            </div>
          )}
          {agreementStatus === "enemy_submitted" && (
            <div className="flex items-center gap-2">
              <Badge className={"text-center"} variant="outline">Other Party Submitted</Badge>
              <span className="text-sm text-gray-600">
                The other party has submitted their agreement. Please submit yours.
              </span>
            </div>
          )}
          {agreementStatus === "none" && (
            <div className="flex items-center gap-2">
              <Badge className={"text-center"} variant="outline">No Agreements Yet</Badge>
              <span className="text-sm text-gray-600">
                Neither party has submitted an agreement yet.
              </span>
            </div>
          )}
        </div>
      )}

      <div
        ref={agreemenBottomtRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >

        {showP2PStatus && showScrollIndicator && (
          <div className="m-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-600 text-sm text-center">
              This content is scrollable. Scroll down or resize the panel to see all agreement parameters.
            </p>
          </div>
        )}
        {acase?.params?.length > 0 ? (
          acase.params.map((param, index) => (
            <div key={param.id || index} className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  {param.name}
                </label>
                {param.tip && (
                  <InfoTooltip
                    content={dataTypeTips?.[param.dataType] || param.tip}
                  />
                )}
              </div>

              {param.dataType === "list" ? (
                <Select
                  value={isAgreementFinal ? (param.value ?? "N/A") : (param.value ?? "")}
                  onValueChange={(value) => handleParamChange(param.id, value, param.dataType)}
                  disabled={isAgreementFinal || finished}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      // Convert listItems string (separated by <>) to options array
                      const options = param.options || (param.listItems ? param.listItems.split("<>").map(item => item.trim()).filter(item => item) : []);
                      if (!options || options.length === 0) {
                        return (
                          <SelectItem value="no-options" disabled>
                            No options available
                          </SelectItem>
                        );
                      }
                      return options.map((option, optionIndex) => (
                        <SelectItem key={optionIndex} value={option}>
                          {option}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              ) : param.dataType === "number" ? (
                <Input
                  type={!isAgreementFinal ? "number" : (param.value !== null && param.value !== undefined) ? "number" : "text"}
                  value={isAgreementFinal ? (param.value ?? "N/A") : (param.value ?? "")}
                  onChange={(e) => handleParamChange(param.id, e.target.value, param.dataType)}
                  placeholder="Enter a number"
                  disabled={isAgreementFinal || finished}
                />
              ) : param.dataType === "text" ? (
                <Textarea
                  value={isAgreementFinal ? (param.value ?? "N/A") : (param.value ?? "")}
                  onChange={(e) => handleParamChange(param.id, e.target.value, param.dataType)}
                  placeholder="Enter text"
                  disabled={isAgreementFinal || finished}
                  rows={3}
                />
              ) : (
                <Input
                  value={isAgreementFinal ? (param.value ?? "N/A") : (param.value ?? "")}
                  onChange={(e) => handleParamChange(param.id, e.target.value, param.dataType)}
                  placeholder="Enter value"
                  disabled={isAgreementFinal || finished}
                />
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No agreement parameters found.</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        {!isAgreementFinal && !finished && (
          <Button
            onClick={handleAgreementSubmit}
            variant="default"
            className="w-full"
            disabled={isAgreementFinal || finished}
          >
            {showP2PStatus && hasOwnAgreement && agreementStatus !== "conflict"
              ? "Update Agreement"
              : "Submit Agreement"
            }
          </Button>
        )}

        {isAgreementFinal && (
          <>
            <div className="text-center text-sm text-gray-600 mb-4">
              {(vsAI && requiresSVI) ? "Fill out SVI to the left, to receive feedback" : "Agreement has been finalized"}
            </div>

            {!isInAppChat && onUploadTranscript && (
              <div className="mt-4 pt-4 border-t">
                <label className="block text-gray-800 font-medium mb-2">
                  Negotiation Transcript
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Please upload your negotiation transcript to receive feedback.
                </p>
                {hasExistingTranscript ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                    <CheckCircle2 size={20} />
                    <span className="text-sm font-medium">Transcript uploaded</span>
                  </div>
                ) : (
                  <Button
                    onClick={onUploadTranscript}
                    variant="outline"
                    disabled={checkingTranscript}
                    className="w-full"
                  >
                    {checkingTranscript ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Transcript
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
