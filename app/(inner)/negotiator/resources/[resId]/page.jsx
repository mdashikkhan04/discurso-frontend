"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { useLoading } from "@/contexts/LoadingContext";
import { fetcher } from "@/lib/fetcher";
import Image from "next/image";
import Link from "next/link";
import { getResourceFileDownloadURL } from "@/lib/client/storage";

export default function PracticePage({ params }) {
  const [resource, setResource] = useState(null);
  const [resourceId, setResourceId] = useState(null);
  const { showLoading, hideLoading } = useLoading();
  const { user } = useUser();

  //   const hasFetchedData = useRef(false);

  // Fetch caseId from the async params
  useEffect(() => {
    const getResId = async () => {
      const resolvedParams = await params; // Unwrap the promise
      //   console.log("resolvedParams", resolvedParams);
      setResourceId(resolvedParams.resId); // Set the caseId after resolving params
    };

    getResId();
  }, [params]); // Re-run if params change

  useEffect(() => {
    if (!user || !resourceId) return;
    const fetchRes = async () => {
      showLoading();
      try {
        const response = await fetcher.get(
          `/api/data/resources/${resourceId}`,
          user
        );
        if (response.ok) {
          let resource = response.result.data;
          resource.files = (
            await Promise.all(
              resource.files.map(async (file) => {
                // console.log("file", file);
                const url = await getResourceFileDownloadURL(file.filename);
                return {
                  orgName: file.orgName,
                  url,
                  isCoverImage: file.isCoverImage,
                  type: file.type,
                };
              })
            )
          ).filter((file) => !file.isCoverImage);
          if (resource.image) {
            resource.imageAlt = resource.image;
            resource.image = await getResourceFileDownloadURL(resource.image);
          }
          // console.log("resource", resource);
          setResource(response.result.data);
        } else {
          console.error("Failed to fetch resource:", response.error);
        }
      } catch (error) {
        console.error("Error during fetch:", error);
      }
      hideLoading();
    };
    fetchRes();

    // if (!hasFetchedData.current) {
    //   fetchRes();
    //   hasFetchedData.current = true;
    // }
  }, [user, resourceId]);

  if (!resource) return null;

  return (
    <div className="flex flex-col min-h-screen p-6 ">
      <header className="mb-8">
        <h1 className="text-xl font-bold mb-2 text-blue-900">
          {resource.title}
        </h1>
        <h2 className="text-base font-medium mb-2 text-gray-700">
          {resource.author}
        </h2>
        {resource.image && (
          <Image
            src={resource.image}
            alt={resource.imageAlt}
            width={400}
            height={400}
          />
        )}
      </header>

      <section className="">
        <div>
          <p className="text-black mb-6 whitespace-pre-wrap">
            {resource.content ? resource.content : resource.desc}
          </p>
        </div>
      </section>

      {resource.files && (
        <section className="">
          <div>
            {resource.files.map((file, index) => (
              <div
                key={index}
                className="max-w-max space-y-2 border p-4 rounded-md mb-2"
              >
                <Link
                  href={file.url}
                  target="_blank"
                  className="text-md font-bold "
                >
                  {file.type && file.type.includes("image") && (
                    <Image
                      src={file.url}
                      alt={file.orgName}
                      width={200}
                      height={200}
                    />
                  )}
                  <h4 className="mt-2">{file.orgName}</h4>
                </Link>
                <br />
                <Link href={file.url} target="_blank">
                  <Button type="button" variant="default" className="mt-2">
                    Open
                  </Button>
                </Link>
                {/* <br /> */}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-screen-2xl mx-auto px-6">
        <div>
          <p className="text-gray-800 mb-6 whitespace-pre-wrap">
            {mockGeneralData.situationalContext}
          </p>

          <p className="text-gray-800 mb-6 whitespace-pre-wrap">
            {mockGeneralData.buyerContext}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-gray-900 font-medium">
            <span>Current score: 54</span>
            <span>Opponent mood: 87</span>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div
              ref={chatContainerRef}
              className="h-64 overflow-auto bg-gray-50 p-2 rounded-md mb-2"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex mb-4 ${
                    msg.sender === "You" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`inline-block p-2 rounded-lg max-w-3/4 ${
                      msg.sender === "You"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    <div
                      className={
                        msg.sender === "You"
                          ? "text-xs text-gray-200 mb-1"
                          : "text-xs text-gray-800 mb-1"
                      }
                    >
                      {msg.sender}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2 border border-gray-300 rounded bg-white text-black"
                placeholder="Type your message here..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Send
              </button>
            </form>
          </div>

          <div className="text-sm text-gray-800 space-y-2">
            <p>
              <strong>Conversation:</strong> {mockFeedback.convo}
            </p>
            <p>
              <strong>Last messages:</strong> {mockFeedback.last}
            </p>
          </div>
        </div>
      </section> */}
    </div>
  );
}
