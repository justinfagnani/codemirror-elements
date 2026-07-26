/**
 * One entry in the language picker.
 *
 * An entry names the element to load and any attributes to set on it, so a
 * single element can appear more than once — `<cm-lang-javascript>` shows up as
 * JavaScript, JSX, and TypeScript.
 */
export interface LanguageSample {
  label: string;
  /** The extension element to load and add to the editor. */
  tag: string;
  /** Attributes to set on that element, for the options it exposes. */
  attributes?: Record<string, string>;
  /** The code shown in the editor, so there is something to highlight. */
  sample: string;
}

/** One entry in the theme picker. */
export interface ThemeEntry {
  label: string;
  /** Which group of the picker this belongs to. */
  variant: 'dark' | 'light' | 'cssVars';
  /**
   * The theme element to load. Themes built from CSS custom properties have
   * none: `<cm-editor>` reads those itself.
   */
  tag?: string;
  /** Properties to set on the editor, for the CSS-driven themes. */
  cssVars?: Record<string, string>;
}

/** The languages shown in the demo. */
export const languages: Array<LanguageSample> = [
  {
    label: 'Angular',
    tag: 'cm-lang-angular',
    sample: `<div class="cart">
  <h2>{{ title | uppercase }}</h2>

  @if (items.length === 0) {
    <p>Your cart is empty.</p>
  } @else {
    <ul>
      @for (item of items; track item.id) {
        <li (click)="select(item)" [class.active]="item === selected">
          {{ item.name }} — {{ item.price | currency }}
        </li>
      }
    </ul>
  }
</div>
`,
  },
  {
    label: 'C++',
    tag: 'cm-lang-cpp',
    sample: `#include <algorithm>
#include <iostream>
#include <vector>

template <typename T>
T median(std::vector<T> values) {
  if (values.empty()) {
    throw std::invalid_argument("median of an empty range");
  }
  auto middle = values.begin() + values.size() / 2;
  std::nth_element(values.begin(), middle, values.end());
  return *middle;
}

int main() {
  std::vector<int> readings{7, 3, 9, 1, 4};
  std::cout << "median: " << median(readings) << '\\n';
}
`,
  },
  {
    label: 'CSS',
    tag: 'cm-lang-css',
    sample: `@layer base, components;

:root {
  --gap: 1rem;
  --accent: oklch(62% 0.19 264);
}

@layer components {
  .card {
    display: grid;
    gap: var(--gap);
    padding: calc(var(--gap) * 1.5);
    border-radius: 12px;
    background: light-dark(#fff, #1c1c1f);
  }

  .card:has(> img) {
    grid-template-columns: 96px 1fr;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .card { transition: translate 150ms ease-out; }
  .card:hover { translate: 0 -2px; }
}
`,
  },
  {
    label: 'Go',
    tag: 'cm-lang-go',
    sample: `package main

import (
	"errors"
	"fmt"
	"sync"
)

var ErrNotFound = errors.New("not found")

type Cache struct {
	mu      sync.RWMutex
	entries map[string]int
}

func (c *Cache) Get(key string) (int, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	v, ok := c.entries[key]
	if !ok {
		return 0, fmt.Errorf("get %q: %w", key, ErrNotFound)
	}
	return v, nil
}

func main() {
	c := &Cache{entries: map[string]int{"answer": 42}}
	fmt.Println(c.Get("answer"))
}
`,
  },
  {
    label: 'HTML',
    tag: 'cm-lang-html',
    sample: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Reading list</title>
    <style>
      body { font: 16px/1.5 system-ui, sans-serif; }
      article[hidden] { display: none; }
    </style>
  </head>
  <body>
    <h1>Reading list</h1>
    <article>
      <h2>The Design of Everyday Things</h2>
      <p>Don Norman &mdash; <time datetime="1988">1988</time></p>
    </article>
    <script type="module">
      document.querySelectorAll('article').forEach((el) => {
        el.addEventListener('click', () => el.toggleAttribute('hidden'));
      });
    </script>
  </body>
</html>
`,
  },
  {
    label: 'Java',
    tag: 'cm-lang-java',
    sample: `package dev.example;

import java.util.List;
import java.util.stream.Collectors;

public record Employee(String name, String team, int salary) {

  public static List<String> topEarners(List<Employee> staff, int cutoff) {
    return staff.stream()
        .filter(e -> e.salary() >= cutoff)
        .sorted((a, b) -> Integer.compare(b.salary(), a.salary()))
        .map(Employee::name)
        .collect(Collectors.toList());
  }

  public String describe() {
    return switch (team) {
      case "platform", "infra" -> name + " keeps the lights on";
      case null -> name + " is unassigned";
      default -> "%s works on %s".formatted(name, team);
    };
  }
}
`,
  },
  {
    label: 'JavaScript',
    tag: 'cm-lang-javascript',
    sample: `const RETRYABLE = new Set([429, 502, 503, 504]);

export async function fetchWithRetry(url, {retries = 3, signal} = {}) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, {signal});

    if (response.ok || !RETRYABLE.has(response.status)) {
      return response;
    }
    if (attempt >= retries) {
      throw new Error(\`\${url} failed after \${retries} retries\`);
    }

    const backoff = 2 ** attempt * 100 + Math.random() * 100;
    await new Promise((resolve) => setTimeout(resolve, backoff));
  }
}
`,
  },
  {
    label: 'JSX',
    tag: 'cm-lang-javascript',
    attributes: {jsx: ''},
    sample: `import {useEffect, useState} from 'react';

export function Clock({label = 'Local time'}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <figure className="clock">
      <figcaption>{label}</figcaption>
      <time dateTime={now.toISOString()}>
        {now.toLocaleTimeString([], {timeStyle: 'medium'})}
      </time>
    </figure>
  );
}
`,
  },
  {
    label: 'TypeScript',
    tag: 'cm-lang-javascript',
    attributes: {typescript: ''},
    sample: `type Result<T, E = Error> =
  | {readonly ok: true; readonly value: T}
  | {readonly ok: false; readonly error: E};

export const ok = <T,>(value: T): Result<T, never> => ({ok: true, value});
export const err = <E,>(error: E): Result<never, E> => ({ok: false, error});

export function unwrapOr<T>(result: Result<T>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

export async function parseJSON<T>(input: string): Promise<Result<T>> {
  try {
    return ok(JSON.parse(input) as T);
  } catch (cause) {
    return err(new Error('invalid JSON', {cause}));
  }
}
`,
  },
  {
    label: 'Jinja',
    tag: 'cm-lang-jinja',
    sample: `{% extends "base.html" %}

{% block content %}
  <h1>{{ page.title|title }}</h1>

  {% for post in posts if not post.draft %}
    <article>
      <h2><a href="{{ url_for('post', slug=post.slug) }}">{{ post.title }}</a></h2>
      <p>{{ post.summary|truncate(160) }}</p>
      <time>{{ post.published_at.strftime('%B %d, %Y') }}</time>
    </article>
  {% else %}
    <p>Nothing published yet.</p>
  {% endfor %}
{% endblock %}
`,
  },
  {
    label: 'JSON',
    tag: 'cm-lang-json',
    sample: `{
  "name": "codemirror-elements",
  "version": "0.0.10",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./lib/*": "./lib/*"
  },
  "keywords": ["codemirror", "custom-elements", "web-components"],
  "engines": {"node": ">=20"},
  "dependencies": {
    "@codemirror/state": "^6.2.0",
    "@codemirror/view": "^6.7.3",
    "lit": "^3.2.1"
  },
  "private": false
}
`,
  },
  {
    label: 'Less',
    tag: 'cm-lang-less',
    sample: `@accent: #3b82f6;
@radius: 8px;

.elevated(@level: 1) {
  box-shadow: 0 (@level * 2px) (@level * 6px) fade(black, 18%);
}

.button {
  .elevated(1);
  padding: 0.5em 1.25em;
  border: 1px solid darken(@accent, 8%);
  border-radius: @radius;
  background: @accent;
  color: contrast(@accent);

  &:hover { background: lighten(@accent, 6%); }
  &.is-ghost {
    background: transparent;
    color: @accent;
  }
}
`,
  },
  {
    label: 'Liquid',
    tag: 'cm-lang-liquid',
    sample: `{% assign featured = collections.frontpage.products | where: "available" %}

<ul class="product-grid">
  {% for product in featured limit: 8 %}
    <li>
      <a href="{{ product.url | within: collection }}">
        <img src="{{ product.featured_image | img_url: '400x' }}" alt="{{ product.title | escape }}">
        <h3>{{ product.title }}</h3>
        <span>{{ product.price | money }}</span>
      </a>
      {% if product.compare_at_price > product.price %}
        <span class="badge">Save {{ product.compare_at_price | minus: product.price | money }}</span>
      {% endif %}
    </li>
  {% endfor %}
</ul>
`,
  },
  {
    label: 'Lit',
    tag: 'cm-lang-lit',
    sample: `import {css, html, LitElement} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';

@customElement('todo-list')
export class TodoList extends LitElement {
  static styles = css\`
    :host {
      display: block;
      font: inherit;
    }
    li[completed] {
      text-decoration: line-through;
      opacity: 0.6;
    }
  \`;

  @property({type: String})
  heading = 'Todo';

  @state()
  private _items = [
    {id: 1, text: 'Wrap a CodeMirror extension', completed: true},
    {id: 2, text: 'Generate the rest', completed: false},
  ];

  render() {
    return html\`
      <h1>\${this.heading}</h1>
      <ul>
        \${repeat(
          this._items,
          (item) => item.id,
          (item) => html\`
            <li ?completed=\${item.completed}>
              <input
                type="checkbox"
                .checked=\${item.completed}
                @change=\${() => this.#toggle(item.id)}
              />
              \${item.text}
            </li>
          \`,
        )}
      </ul>
    \`;
  }

  #toggle(id: number) {
    this._items = this._items.map((item) =>
      item.id === id ? {...item, completed: !item.completed} : item,
    );
  }
}
`,
  },
  {
    label: 'Markdown',
    tag: 'cm-lang-markdown',
    sample: `# codemirror-elements

A set of HTML custom elements for editing source code with **CodeMirror**.

## Install

\`\`\`bash
npm i codemirror-elements
\`\`\`

## Usage

Extensions are elements too, so a themed Python editor is just:

\`\`\`html
<cm-editor>
  <cm-lang-python></cm-lang-python>
  <cm-theme-dracula></cm-theme-dracula>
</cm-editor>
\`\`\`

> Options are attributes, and changing one reconfigures the extension in place.

| Element | Options |
| ------- | ------- |
| \`<cm-lang-sql>\` | \`dialect\`, \`schema\` |
| \`<cm-lang-xml>\` | \`no-auto-close-tags\` |

- [x] Wrap the languages
- [ ] Wrap everything else
`,
  },
  {
    label: 'PHP',
    tag: 'cm-lang-php',
    sample: `<?php

declare(strict_types=1);

namespace App\\Http;

final readonly class Router
{
    /** @var array<string, callable> */
    private array $routes;

    public function __construct(array $routes = [])
    {
        $this->routes = $routes;
    }

    public function dispatch(string $method, string $path): string
    {
        $key = strtoupper($method) . ' ' . $path;

        return match (true) {
            isset($this->routes[$key]) => ($this->routes[$key])(),
            str_starts_with($path, '/api/') => throw new \\RuntimeException('Unknown API route'),
            default => '404 Not Found',
        };
    }
}
`,
  },
  {
    label: 'Python',
    tag: 'cm-lang-python',
    sample: `from __future__ import annotations

import asyncio
from dataclasses import dataclass, field


@dataclass(slots=True)
class Task:
    name: str
    duration: float
    tags: set[str] = field(default_factory=set)

    async def run(self) -> str:
        await asyncio.sleep(self.duration)
        return f"{self.name} finished in {self.duration:.2f}s"


async def main(tasks: list[Task]) -> None:
    async with asyncio.TaskGroup() as group:
        futures = [group.create_task(t.run()) for t in tasks]

    for future in futures:
        print(future.result())


if __name__ == "__main__":
    asyncio.run(main([Task("build", 0.4), Task("test", 1.2, {"ci"})]))
`,
  },
  {
    label: 'Rust',
    tag: 'cm-lang-rust',
    sample: `use std::collections::HashMap;
use std::fmt;

#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    Ident(String),
    Number(f64),
    Punct(char),
}

impl fmt::Display for Token {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Token::Ident(name) => write!(f, "{name}"),
            Token::Number(n) => write!(f, "{n}"),
            Token::Punct(c) => write!(f, "{c}"),
        }
    }
}

pub fn histogram(tokens: &[Token]) -> HashMap<String, usize> {
    let mut counts = HashMap::new();
    for token in tokens {
        *counts.entry(token.to_string()).or_insert(0) += 1;
    }
    counts
}
`,
  },
  {
    label: 'Sass (indented)',
    tag: 'cm-lang-sass',
    attributes: {indented: ''},
    sample: `@use "sass:color"

$accent: #e11d48
$radius: 6px

=focus-ring($color: $accent)
  outline: 2px solid $color
  outline-offset: 2px

.alert
  padding: 1rem
  border-radius: $radius
  border-left: 4px solid $accent
  background: color.scale($accent, $lightness: 88%)

  &:focus-visible
    +focus-ring

  .title
    font-weight: 600
    color: color.scale($accent, $lightness: -25%)
`,
  },
  {
    label: 'SCSS',
    tag: 'cm-lang-sass',
    sample: `@use "sass:math";

$columns: 12;
$gutter: 16px;

@mixin span($n) {
  width: math.percentage(math.div($n, $columns));
  padding-inline: math.div($gutter, 2);
}

.grid {
  display: flex;
  flex-wrap: wrap;
  margin-inline: math.div($gutter, -2);

  @for $i from 1 through $columns {
    > .col-#{$i} {
      @include span($i);
    }
  }

  &--tight {
    --gutter: #{math.div($gutter, 2)};
  }
}
`,
  },
  {
    label: 'SQL',
    tag: 'cm-lang-sql',
    attributes: {dialect: 'PostgreSQL'},
    sample: `WITH monthly AS (
  SELECT
    date_trunc('month', o.created_at) AS month,
    c.region,
    sum(o.total_cents) / 100.0 AS revenue
  FROM orders AS o
  JOIN customers AS c ON c.id = o.customer_id
  WHERE o.status = 'fulfilled'
    AND o.created_at >= now() - interval '2 years'
  GROUP BY 1, 2
)
SELECT
  month,
  region,
  revenue,
  lag(revenue) OVER (PARTITION BY region ORDER BY month) AS prev_revenue,
  round(
    100 * (revenue - lag(revenue) OVER (PARTITION BY region ORDER BY month))
      / nullif(lag(revenue) OVER (PARTITION BY region ORDER BY month), 0),
    1
  ) AS pct_change
FROM monthly
ORDER BY region, month DESC;
`,
  },
  {
    label: 'Vue',
    tag: 'cm-lang-vue',
    sample: `<template>
  <form class="search" @submit.prevent="onSubmit">
    <label :for="id">{{ label }}</label>
    <input :id="id" v-model.trim="query" type="search" :placeholder="placeholder" />

    <ul v-if="results.length">
      <li v-for="result in results" :key="result.id" @click="select(result)">
        {{ result.title }}
      </li>
    </ul>
    <p v-else-if="query">No matches for "{{ query }}".</p>
  </form>
</template>

<script setup>
import {ref, watchEffect} from 'vue';

const query = ref('');
const results = ref([]);

watchEffect(async () => {
  if (!query.value) return (results.value = []);
  results.value = await search(query.value);
});
</script>
`,
  },
  {
    label: 'WebAssembly Text',
    tag: 'cm-lang-wast',
    sample: `(module
  (memory (export "memory") 1)

  (func $fib (param $n i32) (result i32)
    (local $a i32)
    (local $b i32)
    (local $tmp i32)
    (local.set $b (i32.const 1))

    (block $done
      (loop $loop
        (br_if $done (i32.eqz (local.get $n)))
        (local.set $tmp (i32.add (local.get $a) (local.get $b)))
        (local.set $a (local.get $b))
        (local.set $b (local.get $tmp))
        (local.set $n (i32.sub (local.get $n) (i32.const 1)))
        (br $loop)
      )
    )
    (local.get $a)
  )

  (export "fib" (func $fib))
)
`,
  },
  {
    label: 'XML',
    tag: 'cm-lang-xml',
    sample: `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>codemirror-elements releases</title>
    <link>https://github.com/justinfagnani/codemirror-elements</link>
    <description>Custom elements for editing source code</description>
    <atom:link href="https://example.com/feed.xml" rel="self" type="application/rss+xml" />

    <item>
      <title>v0.0.10</title>
      <guid isPermaLink="false">tag:example.com,2026:v0.0.10</guid>
      <pubDate>Mon, 06 Jul 2026 12:00:00 GMT</pubDate>
      <description><![CDATA[Adds <cm-lang-*> elements for every official language.]]></description>
    </item>
  </channel>
</rss>
`,
  },
  {
    label: 'YAML',
    tag: 'cm-lang-yaml',
    sample: `name: CI

on:
  push:
    branches: [main]
  pull_request:

defaults: &defaults
  runs-on: ubuntu-latest
  timeout-minutes: 10

jobs:
  test:
    <<: *defaults
    strategy:
      fail-fast: false
      matrix:
        node: [20, 22, 24]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm test
`,
  },
];

/**
 * The themes shown in the demo. `variant` only drives the grouping in the
 * picker; the theme itself carries all of the editor's styling.
 */
export const themes: Array<ThemeEntry> = [
  {label: 'Amy', tag: 'cm-theme-amy', variant: 'dark'},
  {label: 'GitHub Dark', tag: 'cm-theme-github-dark', variant: 'dark'},
  {label: 'GitHub Light', tag: 'cm-theme-github-light', variant: 'light'},
  {label: 'Gruvbox Dark', tag: 'cm-theme-gruvbox-dark', variant: 'dark'},
  {label: 'Gruvbox Light', tag: 'cm-theme-gruvbox-light', variant: 'light'},
  {label: 'Material Dark', tag: 'cm-theme-material-dark', variant: 'dark'},
  {label: 'Material Light', tag: 'cm-theme-material-light', variant: 'light'},
  {label: 'Monokai', tag: 'cm-theme-monokai', variant: 'dark'},
  {label: 'Nord', tag: 'cm-theme-nord', variant: 'dark'},
  {label: 'Solarized Dark', tag: 'cm-theme-solarized-dark', variant: 'dark'},
  {label: 'VS Code Dark', tag: 'cm-theme-vscode-dark', variant: 'dark'},
  {label: 'VS Code Light', tag: 'cm-theme-vscode-light', variant: 'light'},
  {label: 'Ayu Light', tag: 'cm-theme-ayu-light', variant: 'light'},
  {label: 'Barf', tag: 'cm-theme-barf', variant: 'dark'},
  {label: 'Bespin', tag: 'cm-theme-bespin', variant: 'dark'},
  {
    label: 'Birds of Paradise',
    tag: 'cm-theme-birds-of-paradise',
    variant: 'dark',
  },
  {label: 'Boys and Girls', tag: 'cm-theme-boys-and-girls', variant: 'dark'},
  {label: 'Clouds', tag: 'cm-theme-clouds', variant: 'light'},
  {label: 'Cobalt', tag: 'cm-theme-cobalt', variant: 'dark'},
  {label: 'Cool Glow', tag: 'cm-theme-cool-glow', variant: 'dark'},
  {label: 'Dracula', tag: 'cm-theme-dracula', variant: 'dark'},
  {label: 'Espresso', tag: 'cm-theme-espresso', variant: 'light'},
  {label: 'Noctis Lilac', tag: 'cm-theme-noctis-lilac', variant: 'light'},
  {label: 'One Dark', tag: 'cm-theme-one-dark', variant: 'dark'},
  {label: 'Rosé Pine Dawn', tag: 'cm-theme-rose-pine-dawn', variant: 'light'},
  {label: 'Smoothy', tag: 'cm-theme-smoothy', variant: 'light'},
  {label: 'Solarized Light', tag: 'cm-theme-solarized-light', variant: 'light'},
  {label: 'Tomorrow', tag: 'cm-theme-tomorrow', variant: 'light'},

  // These have no element at all: `<cm-editor>` reads the custom properties
  // itself, so the demo only has to set them.
  {
    label: 'CSS variables (dark)',
    variant: 'cssVars',
    cssVars: {
      // The theme reads the standard `color-scheme` property to decide which
      // half of CodeMirror's base theme to pair with these colors.
      'color-scheme': 'dark',
      '--cm-background': '#1e1e2e',
      '--cm-foreground': '#cdd6f4',
      '--cm-caret': '#f5e0dc',
      '--cm-selection': '#414458',
      '--cm-active-line': '#1c1c2b',
      '--cm-gutter-background': '#1e1e2e',
      '--cm-gutter-foreground': '#6c7086',
      '--cm-gutter-active-foreground': '#cdd6f4',
      '--cm-comment': '#6c7086',
      '--cm-keyword': '#cba6f7',
      '--cm-string': '#a6e3a1',
      '--cm-number': '#fab387',
      '--cm-function': '#89b4fa',
      '--cm-type': '#f9e2af',
      '--cm-constant': '#fab387',
      '--cm-operator': '#89dceb',
      '--cm-property': '#89b4fa',
      '--cm-tag': '#f38ba8',
      '--cm-attribute': '#f9e2af',
      '--cm-variable': '#cdd6f4',
    },
  },
  {
    label: 'CSS variables (light)',
    variant: 'cssVars',
    cssVars: {
      'color-scheme': 'light',
      '--cm-background': '#fdfdfd',
      '--cm-foreground': '#31353f',
      '--cm-selection': '#d7e3f4',
      '--cm-active-line': '#f3f5f9',
      '--cm-gutter-background': '#fdfdfd',
      '--cm-gutter-foreground': '#9aa0ab',
      '--cm-comment': '#9aa0ab',
      '--cm-keyword': '#a626a4',
      '--cm-string': '#50a14f',
      '--cm-number': '#986801',
      '--cm-function': '#4078f2',
      '--cm-type': '#c18401',
      '--cm-property': '#4078f2',
      '--cm-tag': '#e45649',
    },
  },
];
