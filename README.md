# Jiraish

Jiraish is een compacte, Jira-achtige sprint- en backlogweergave voor Azure DevOps. De app draait volledig als statische website en communiceert rechtstreeks vanuit de browser met de Azure DevOps REST API.

## Functionaliteit

- Sprintboard met kolommen voor To do, Active en Done
- Backlogtabellen per sprint in Azure DevOps-backlogvolgorde
- Filters voor type, assignee, priority, sprint, state, area, tags en feature
- Work-items bekijken en direct aanpassen
- Bewerken van titel, beschrijving, status, assignee, priority, story points, area, sprint en tags
- Licht en donker thema
- Responsive weergave voor desktop en mobiel
- Dynamische branding op basis van het gekozen Azure DevOps-team

## Lokaal gebruiken

Er is geen buildstap nodig. Serveer de map `dist` met een eenvoudige webserver:

```bash
python3 -m http.server 8080 --directory dist
```

Open daarna `http://localhost:8080`.

## Azure DevOps instellen

Open Jiraish en vul een Azure DevOps-URL en een Personal Access Token in. Jiraish accepteert een organisatie-, project- of team-URL:

```text
https://dev.azure.com/organisatie/
https://dev.azure.com/organisatie/project/
https://dev.azure.com/organisatie/project/team/
```

Bij een team-URL wordt dat team bij de eerste keer openen als standaard gekozen. Zonder team gebruikt Jiraish het eerder gekozen team of, als dat niet beschikbaar is, het eerste team. Bij een URL met alleen de organisatie gebruikt Jiraish het eerder gekozen project of het eerste beschikbare project.

De PAT heeft minimaal leesrechten op projecten, teams, iteraties en work-items nodig. Voor het aanpassen van work-items zijn ook schrijfrechten voor work-items vereist.

De URL en PAT worden uitsluitend in de lokale browseropslag bewaard. Publiceer of commit nooit een PAT.

## GitHub Pages

De workflow in `.github/workflows/deploy-pages.yml` publiceert de inhoud van `dist` bij iedere push naar `main`. Voor een repository met de naam `jiraish` wordt de standaard projectsite:

```text
https://<github-gebruiker>.github.io/jiraish/
```

GitHub Pages moet in de repository-instellingen als publicatiebron **GitHub Actions** gebruiken.

## Projectstructuur

```text
dist/
  index.html
  app.js
  styles.css
.github/workflows/deploy-pages.yml
```

## Beveiliging

Jiraish is een client-side toepassing. Iedereen met toegang tot het browserprofiel kan mogelijk de lokaal opgeslagen PAT uitlezen. Gebruik daarom een PAT met minimale rechten en een korte geldigheidsduur.
