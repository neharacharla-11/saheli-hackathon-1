"use client";

import { useEffect } from "react";
import { translate } from "@/i18n";
import { useAppStore, useHydrated } from "@/lib/store";

const ATTRS = ["placeholder", "aria-label", "title"] as const;
const SKIP = '[data-no-translate],[translate="no"],script,style,textarea,code,pre,[contenteditable="true"]';

/* What the page said before we translated it, so English can be restored. */
const textOriginal = new WeakMap<Text, string>();
const textApplied = new WeakMap<Text, string>();
const attrOriginal = new WeakMap<Element, Record<string, string>>();
const attrApplied = new WeakMap<Element, Record<string, string>>();
const touchedText = new Set<Text>();
const touchedEls = new Set<Element>();

function skipped(el: Element | null): boolean {
  return !el || !!el.closest(SKIP);
}

function doText(node: Text, lang: string) {
  const now = node.data;
  if (textApplied.get(node) === now) return; // our own write
  if (skipped(node.parentElement)) return;
  // React (or anything else) wrote fresh English: that is the new original.
  textOriginal.set(node, now);
  const out = translate(now, lang);
  if (out !== now) {
    textApplied.set(node, out);
    touchedText.add(node);
    node.data = out;
  }
}

function doAttrs(el: Element, lang: string) {
  if (skipped(el)) return;
  for (const a of ATTRS) {
    const now = el.getAttribute(a);
    if (now === null) continue;
    const applied = attrApplied.get(el) ?? {};
    if (applied[a] === now) continue;
    const orig = attrOriginal.get(el) ?? {};
    orig[a] = now;
    attrOriginal.set(el, orig);
    const out = translate(now, lang);
    if (out !== now) {
      applied[a] = out;
      attrApplied.set(el, applied);
      touchedEls.add(el);
      el.setAttribute(a, out);
    }
  }
}

function walk(root: Node, lang: string) {
  if (root.nodeType === Node.TEXT_NODE) {
    doText(root as Text, lang);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (skipped(el)) return;
  doAttrs(el, lang);
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.nodeType === Node.ELEMENT_NODE && (n as Element).matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  let n = tw.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) doText(n as Text, lang);
    else doAttrs(n as Element, lang);
    n = tw.nextNode();
  }
}

function restoreAll() {
  for (const node of touchedText) {
    const orig = textOriginal.get(node);
    if (orig !== undefined && node.data === textApplied.get(node)) node.data = orig;
    textApplied.delete(node);
  }
  touchedText.clear();
  for (const el of touchedEls) {
    const orig = attrOriginal.get(el) ?? {};
    const applied = attrApplied.get(el) ?? {};
    for (const a of Object.keys(applied)) {
      if (el.getAttribute(a) === applied[a] && orig[a] !== undefined) el.setAttribute(a, orig[a]);
    }
    attrApplied.delete(el);
  }
  touchedEls.clear();
}

/**
 * Shows the app in her language. Mounted once in the root layout.
 * English is the source; Hindi and Marathi come from src/i18n.
 * Anything inside [data-no-translate] (the logo, her own words) is left alone.
 */
export function Translator() {
  const hydrated = useHydrated();
  const lang = useAppStore((s) => s.language);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = lang || "en";
    if (!lang || lang === "en") {
      restoreAll();
      return;
    }
    walk(document.body, lang);
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === "characterData") doText(r.target as Text, lang);
        else if (r.type === "attributes") doAttrs(r.target as Element, lang);
        else r.addedNodes.forEach((n) => walk(n, lang));
      }
    });
    mo.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });
    return () => {
      mo.disconnect();
      restoreAll();
    };
  }, [hydrated, lang]);

  return null;
}
