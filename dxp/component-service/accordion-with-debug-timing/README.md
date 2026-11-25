# Accordion (debug timing)

Diagnostic variant of the Accordion component. Renders the same markup but emits `[CMP DEBUG]` phased timing logs to the DXP Monitoring service.

## Description

An accordion displays a list of headings with hidden related content on the page. Users can show and hide related content by clicking on the heading.

## Debug timing logs

This component emits `[CMP DEBUG]` phased timing logs when the `CMP_DEBUG_TIMING` environment variable is set to `true`. Logs are **off by default** — see the project README for setup and interpretation.

- `+Nms` = milliseconds since `main()` started (cumulative, not per-step).
- Marks are placed at config parse, HTML render, and exit.
- See `doc/edge-component-debug-timing-handover.md` for full instructions.

Example output:

```
[CMP DEBUG] accordion-with-debug-timing main started (+0ms)
[CMP DEBUG] accordion-with-debug-timing config ready titlePresent=true accordionCount=3 (+0ms)
[CMP DEBUG] accordion-with-debug-timing starting HTML markup render (+0ms)
[CMP DEBUG] accordion-with-debug-timing HTML markup render complete length=1234 (+1ms)
[CMP DEBUG] accordion-with-debug-timing main complete (+1ms)
```

## Editing

To customize and configure the component, you can pass different properties to modify its behavior or appearance. Specifically, you can change the heading and content for each accordion item. There is a minimum of 1 item and a maximum of 20 items.

## Properties Example:

```
{
  "accordion": [
    {
      "heading": "Accordion One",
      "content": "<p>This is accordion one!</p>"
    },
    {
      "heading": "Accordion Two",
      "content": "<p>This is accordion two!</p>"
    },
    {
      "heading": "Accordion Three",
      "content": "<p>This is accordion three!</p>"
    }
  ]
}
```

## Component Properties

| Property  |      Property Description       | Property Type | Is Required | Default |
| :-------- | :-----------------------------: | :-----------: | :---------: | :-----: |
| title     |        The section title        |    string     |             |         |
| accordion |       The accordion items       |     array     |      ✓      |         |
| heading   | The accordion item heading text |    string     |      ✓      |         |
| content   |   The accordion item content    | FormattedText |      ✓      |         |
