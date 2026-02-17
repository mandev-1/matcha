"use client";

import React, { useEffect, useMemo } from "react";
import { Card, CardBody } from "@heroui/card";

interface MarkdownRendererProps {
  content: string;
  onHeadingsExtracted?: (headings: Heading[]) => void;
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

// Helper function to create slug from text
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function MarkdownRenderer({ content, onHeadingsExtracted }: MarkdownRendererProps) {
  // Extract headings from content
  const headings = useMemo(() => {
    const extracted: Heading[] = [];
    const lines = content.split("\n");
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        const headingText = trimmed.substring(2);
        extracted.push({ id: createSlug(headingText), text: headingText, level: 1 });
      } else if (trimmed.startsWith("## ")) {
        const headingText = trimmed.substring(3);
        extracted.push({ id: createSlug(headingText), text: headingText, level: 2 });
      } else if (trimmed.startsWith("### ")) {
        const headingText = trimmed.substring(4);
        extracted.push({ id: createSlug(headingText), text: headingText, level: 3 });
      } else if (trimmed.startsWith("#### ")) {
        const headingText = trimmed.substring(5);
        extracted.push({ id: createSlug(headingText), text: headingText, level: 4 });
      }
    });
    
    return extracted;
  }, [content]);

  // Notify parent of headings after render
  useEffect(() => {
    if (onHeadingsExtracted && headings.length > 0) {
      onHeadingsExtracted(headings);
    }
  }, [headings, onHeadingsExtracted]);

  // Simple markdown parser for GitHub-style README
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockLang = "";
    let codeBlockContent: string[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-4 ml-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-default-700 dark:text-default-300">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <pre
            key={`code-${elements.length}`}
            className="bg-default-200 dark:bg-default-800 p-4 rounded-lg overflow-x-auto my-4"
          >
            <code className="text-sm font-mono text-default-900 dark:text-default-100">
              {codeBlockContent.join("\n")}
            </code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      }
    };

    const parseInlineMarkdown = (text: string): React.ReactNode => {
      const parts: React.ReactNode[] = [];
      let currentIndex = 0;

      // Handle inline code
      const codeRegex = /`([^`]+)`/g;
      let match;
      let lastIndex = 0;

      while ((match = codeRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(
          <code
            key={`code-${currentIndex}`}
            className="bg-default-200 dark:bg-default-800 px-1.5 py-0.5 rounded text-sm font-mono text-default-900 dark:text-default-100"
          >
            {match[1]}
          </code>
        );
        lastIndex = match.index + match[0].length;
        currentIndex++;
      }
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      // Handle bold
      const boldRegex = /\*\*([^*]+)\*\*/g;
      const processedParts: React.ReactNode[] = [];
      parts.forEach((part, idx) => {
        if (typeof part === "string") {
          let partIndex = 0;
          let partLastIndex = 0;
          const boldMatches: Array<{ start: number; end: number; text: string }> = [];
          let boldMatch;
          while ((boldMatch = boldRegex.exec(part)) !== null) {
            boldMatches.push({
              start: boldMatch.index,
              end: boldMatch.index + boldMatch[0].length,
              text: boldMatch[1],
            });
          }
          if (boldMatches.length > 0) {
            boldMatches.forEach((bm, bmIdx) => {
              if (bm.start > partLastIndex) {
                processedParts.push(part.substring(partLastIndex, bm.start));
              }
              processedParts.push(
                <strong key={`bold-${idx}-${bmIdx}`} className="font-semibold text-default-900 dark:text-default-100">
                  {bm.text}
                </strong>
              );
              partLastIndex = bm.end;
            });
            if (partLastIndex < part.length) {
              processedParts.push(part.substring(partLastIndex));
            }
          } else {
            processedParts.push(part);
          }
        } else {
          processedParts.push(part);
        }
      });

      return processedParts.length > 0 ? <>{processedParts}</> : text;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Code blocks
      if (trimmed.startsWith("```")) {
        if (inCodeBlock) {
          flushCodeBlock();
        } else {
          codeBlockLang = trimmed.substring(3).trim();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headers (ids must match useMemo extraction via createSlug)
      if (trimmed.startsWith("# ")) {
        flushList();
        const headingText = trimmed.substring(2);
        const headingId = createSlug(headingText);
        elements.push(
          <h1 
            id={headingId}
            key={`h1-${index}`} 
            className="text-4xl font-bold mt-8 mb-4 text-default-900 dark:text-default-100 border-b border-default-300 dark:border-default-700 pb-2 scroll-mt-20"
          >
            {parseInlineMarkdown(headingText)}
          </h1>
        );
        return;
      }
      if (trimmed.startsWith("## ")) {
        flushList();
        const headingText = trimmed.substring(3);
        const headingId = createSlug(headingText);
        elements.push(
          <h2 
            id={headingId}
            key={`h2-${index}`} 
            className="text-3xl font-bold mt-6 mb-3 text-default-900 dark:text-default-100 scroll-mt-20"
          >
            {parseInlineMarkdown(headingText)}
          </h2>
        );
        return;
      }
      if (trimmed.startsWith("### ")) {
        flushList();
        const headingText = trimmed.substring(4);
        const headingId = createSlug(headingText);
        elements.push(
          <h3 
            id={headingId}
            key={`h3-${index}`} 
            className="text-2xl font-semibold mt-4 mb-2 text-default-900 dark:text-default-100 scroll-mt-20"
          >
            {parseInlineMarkdown(headingText)}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith("#### ")) {
        flushList();
        const headingText = trimmed.substring(5);
        const headingId = createSlug(headingText);
        elements.push(
          <h4 
            id={headingId}
            key={`h4-${index}`} 
            className="text-xl font-semibold mt-3 mb-2 text-default-900 dark:text-default-100 scroll-mt-20"
          >
            {parseInlineMarkdown(headingText)}
          </h4>
        );
        return;
      }

      // Lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (!inList) {
          inList = true;
        }
        listItems.push(trimmed.substring(2));
        return;
      }

      // Empty lines
      if (trimmed === "") {
        flushList();
        const last = elements[elements.length - 1];
        const isBr = React.isValidElement(last) && last.type === "br";
        if (elements.length > 0 && !isBr) {
          elements.push(<br key={`br-${index}`} />);
        }
        return;
      }

      // Regular paragraphs
      flushList();
      elements.push(
        <p key={`p-${index}`} className="my-3 text-default-700 dark:text-default-300 leading-relaxed">
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    });

    flushList();
    flushCodeBlock();

    return elements;
  };

  return (
    <Card className="bg-default-50 dark:bg-default-100">
      <CardBody className="p-8">
        <article className="prose prose-lg dark:prose-invert max-w-none">
          {parseMarkdown(content)}
        </article>
      </CardBody>
    </Card>
  );
}
