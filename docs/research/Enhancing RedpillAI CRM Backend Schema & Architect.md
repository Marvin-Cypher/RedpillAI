# Enhancing RedpillAI CRM Backend Schema & Architecture

# Proposal:

## Overview and Objectives

RedpillAI’s current backend (FastAPI + SQLModel + PostgreSQL) supports a basic VC CRM with companies and deals, but it lacks rich relationships like multiple founders, tagging, and detailed interactions. By studying TwentyHQ’s open-source CRM model, we can **refactor Redpill’s schema and service layer** to support more complex venture CRM features while maintaining compatibility. Key goals include: enabling multiple founders (Person records) per company, introducing a flexible tagging system, unifying company–deal–person–user links, tracking ownership stakes, and designing a modular API layer (REST/GraphQL) for extensibility. We will also ensure the **widget-based company dashboard** remains robust to new data widgets.

**Scope** – We focus on back-end improvements: database schema changes and FastAPI service patterns (inspired by Twenty’s NestJS/GraphQL layering), *not* the UI. We outline new models, relationships, and API patterns, plus best practices for search, analytics, and widget extensibility.

## Proposed Database Schema Changes

*Proposed RedpillAI schema with new relations (dashed lines = many-to-many or optional links). Companies link to multiple Persons (founders), Deals, and Tags; Persons can link to tags and optionally multiple companies via ownership records. Internal Users can own Companies/Deals. All main entities support tagging.*

**1. Companies & Founders (Person Entities):** Currently, Redpill stores founder info only in unstructured data (e.g. a list of names in `enriched_data` or `team_data`). We propose introducing a **Person** (or `Founder`) table as a first-class entity to represent people (founders, key executives, etc.). Each Person record would include fields like name, title, contact info (email, LinkedIn, etc.), and profile details. We model a **one-to-many** from Company to Person: a Company can have multiple Person records associated (founders/co-founders), similar to Twenty’s “people linked to the company”. In the Person model, we store a `company_id` (nullable if a person is not currently affiliated). This allows **multiple founders per company** natively. For example, TwentyHQ’s `CompanyWorkspaceEntity` has a `people` relation listing all associated Person contacts, and each `Person` has a `company` field referencing their company.

– *Optional multi-affiliation:* If a person might be involved in multiple companies (serial entrepreneurs, board members), we can extend to a **many-to-many** via a join table (e.g. `company_person` with roles like *Founder*, *Advisor*, etc.). Initially, a simpler one-company-per-person approach (like Twenty’s *Person.company* relation) is acceptable for MVP, representing primary affiliation. We can later add an “employment/affiliation” table for historical or multiple roles if needed.

– *Person Profile Data:* The Person table centralizes founder profiles that were previously scattered. We can migrate existing founder info from `Company.enriched_data['founders']` into Person records, preserving details like LinkedIn or bio if available. Each Person can also have an `owner_user_id` to indicate which internal user “owns” that relationship (if needed for assignment).

**2. Deals & Opportunities:** The Deal model already links to Company (`deal.company_id`). We suggest adding a link from Deal to Person for the **primary contact** in that deal (e.g. the founder or representative). This mirrors TwentyHQ’s model where a Person can be “point of contact” for many opportunities. Concretely, add an optional `contact_person_id` foreign key on deals. This way, each deal/opportunity can reference the relevant founder (if any) as the main contact. It unifies the company–deal–person relationship: e.g. query a company’s deals and easily get the founders involved.

We also maintain the `created_by` field linking internal User who created the deal, and can add an explicit `owner_user_id` on Deal if deal ownership might be transferred (so internal ownership can differ from creator). This aligns with Twenty’s concept of an “Account Owner” on companies and could be extended to deals (e.g. assign a lead partner to a deal).

**3. Tagging System:** Introduce a generic tagging feature to categorize companies, deals, and people. We create a `Tag` table (id, name, maybe tag category) and establish **many-to-many** relationships:

- `company_tags` linking companies ↔ tags
- `deal_tags` linking deals ↔ tags
- `person_tags` linking people ↔ tags

This lets users label records (e.g. tag a Company as “Web3” or a Person as “Technical Founder”). For simplicity, use join tables with foreign keys to each entity. (Alternatively, a single polymorphic tag linkage table could be used with an object_type field, but separate tables keep referential integrity and simpler queries).

We’ll add FastAPI endpoints to create/list tags and assign tags to objects. Querying by tag becomes easier by joining these tables. Indexes on tag names and these association tables will facilitate fast filtering (e.g. find all companies tagged “AI”). Tagging combined with search (see below) enables richer filtering of the CRM data.

**4. Ownership Structure (Cap Table):** To track equity ownership or investor stakes in companies, we recommend an **Ownership** table. This table could capture relationships like *Person A owns X% of Company B*. It might include fields: `company_id`, `person_id`, `ownership_type` (e.g. *Founder*, *Investor*, *Employee*), and percentage or shares. This effectively is a many-to-many between Person and Company with extra attributes. For founders, we’d record their equity stake; for external investors or cap-table entries, we could also represent them as Person (or a separate entity for investor organization if needed).

This “ownership” model ensures the **cap table** or founder equity is tracked structurally rather than just free text. It also complements the Person–Company link: e.g. Person X marked as Founder in Ownership can also be the Person affiliated to the Company. If implementing Ownership, we can set `Person.company_id` as primary affiliation (e.g. employer) and use Ownership records for additional stakes (like if a person founded multiple companies, they’ll have multiple Ownership entries but one main current company).

**5. Audit Trails & Interactions:** Extend auditing beyond the current Deal status history. Redpill already tracks deal status changes in a `DealStatusHistory` table for an audit trail of pipeline changes. We propose a more generalized **Timeline or Activity** log, similar to Twenty’s `TimelineActivity` which links to various objects. For example, an `Activity` table could record interactions/events with fields: `id, timestamp, user_id (actor), action_type, note` and a polymorphic reference to an entity (company/deal/person). Each time a significant event occurs – e.g. a meeting held, a note added, status changed, email sent – an Activity entry is logged pointing to the relevant Company/Deal/Person. This unified timeline makes it easy to display a chronological history of interactions on a company or deal page (which is common in CRMs).

Implementing this could be done via separate linking tables per entity (like `company_activities`, `deal_activities` if avoiding polymorphism in SQLModel) or by using a generic `entity_type` and `entity_id` in Activity. Given FastAPI + SQLModel lacks built-in polymorphic relations, a straightforward approach is to have an Activity table and not enforce the foreign key at the DB level, but store e.g. `company_id` or `deal_id` when applicable. Alternatively, use separate Note/Task tables with foreign keys as in Twenty (e.g. `NoteTarget` linking a Note to either a person or company), but that increases number of tables. A simpler **audit log** table capturing textual entries per object might suffice initially.

Either way, we should also add **created_by/updated_by fields on core tables** where missing. For instance, the Company model currently lacks a created_by field (who added the company). Adding `created_by` (User FK) and perhaps `owner_user_id` to Company aligns with best practice and Twenty’s schema. This will help with both audit (who created/modified) and assignment of responsibility.

**6. SQLModel Adjustments:** We’ll update or introduce Pydantic models accordingly:

- **Company**: add `owner_user_id`, possibly remove or deprecate JSON fields if replaced by structured ones (e.g. `enriched_data` might be partly superseded by structured profile fields and the new related tables).
- **Person**: new SQLModel class, including relationships: `company: Company` (back_populates `people` on Company), and possibly `deals: List[Deal]` (if we add person as deal contact).
- **Deal**: add `contact_person_id` (FK to Person) and relationship `contact_person: Person` (back_populates could be `deals_as_contact` on Person).
- **Tag**: new model; plus association models or use SQLModel’s `Relationship(sa_relationship_kwargs={"secondary": ...})` for many-to-many.
- **Ownership** (if implemented): a model with FKs to person and company, plus fields like percentage.
- **Activity**: model with fields for event and optional FKs (or separate specialized tables for each activity type like meetings, notes – Redpill already has `Meeting` and `Document` models tied to deals).

Where possible, use SQLModel’s `Relationship` to define convenient accessors. For example, `Company.people: List[Person]` (back_populates `company`), `Company.tags: List[Tag]` (via secondary table), etc. We will also add appropriate DB **indexes**: e.g. index `Person.name` and `Deal.stage/status` (likely already indexed), and foreign keys for faster joins.

**Schema Diagram:** The diagram above summarizes the updated schema and core relations. In summary, **Companies** connect to **People (founders)**, **Deals (opportunities)**, **Tags**, and internal **Users** (owner). **Deals** link to a Company, a primary contact Person, tags, and an internal user owner. **People** link to a Company (current affiliation), can be associated with multiple companies via ownership records, and can be tagged. **Users** (venture team members) are related as creators or owners of deals/companies. These changes will enable richer data queries (e.g. list all fintech companies with at least one founder who had a prior exit, or tag all deals led by a certain partner, etc.).

## API Layer Design and Patterns

With the schema expanded, we recommend refactoring the FastAPI layer to better organize these relationships and possibly introduce a GraphQL interface for more flexible queries.

**1. Modular REST Endpoints:** Continue using FastAPI routers, but organize them by resource and relationship. For instance:

- `/companies/` – extended to include nested data. We can allow query params or sub-routes to fetch related info (e.g. `GET /companies/{id}?include=people,deals` to include founder and deal info in one response). This avoids too many roundtrips. FastAPI’s Pydantic models can nest the related models (e.g. define a `CompanyReadDetailed` with a list of PersonRead and DealRead children).
- New endpoints for the new models: `/people/` for person CRUD (founders), `/tags/` for tag management, and sub-routes like `/companies/{id}/tags` to assign tags, `/companies/{id}/people` to list or add founders to a company, etc.
- Use **relationship endpoints** to manage links: e.g. `POST /companies/{id}/people` with a person payload to add a founder, or `POST /companies/{id}/tags/{tagName}` to tag a company. This keeps logic clear and avoids mixing in the main company endpoint.
- Ensure consistency: companies and deals should have similar patterns (e.g. both support tagging, both return created_by and owner fields, etc.).

**2. GraphQL Layer (optional but recommended):** Given the interconnected nature of the data, introducing a GraphQL API on top of FastAPI can be highly beneficial. TwentyHQ uses GraphQL to let clients query exactly the data needed. We can use libraries like **Strawberry or Ariadne** with FastAPI to define a GraphQL schema reflecting our models. For example, define types: `Company` (with fields and nested `people`, `deals` lists), `Person` (with their company and maybe deals list), etc. A GraphQL query might request a company with its founders and deals in one call, or fetch a person and the company and deal they’re involved in – this flexibility is hard to achieve with pure REST without multiple calls or over-fetching.

If GraphQL is added, we maintain the REST endpoints for compatibility, but gradually encourage using GraphQL for complex UI views (like a single query to populate a company profile page with all widgets and related data). This approach mirrors Twenty’s layering: they likely have NestJS GraphQL resolvers that load data from services, enabling rich object graphs.

**3. Service Layer Abstraction:** In the current Redpill code, some business logic is already in service classes (e.g. `CompanyDataService`, `SmartCacheService`, etc.). We should continue that approach for new features:

- Create a `PersonService` for operations related to founders/contacts (e.g. creating a person and linking to a company, merging duplicate persons, etc.).
- A `TagService` to handle tag creation, deletion, and assignment logic (e.g. ensure a tag name is unique per workspace, etc.).
- Extend `CompanyService` to include methods like `add_founder(company, person)` or `assign_owner(company, user)` for internal assignments.
- Using services keeps the FastAPI routers thin (just orchestrating request/response and calling services), making it easier to eventually separate into microservices if needed.

**4. Authentication & Multi-User Considerations:** With expanded features, ensure that **access control** is considered. For example, only allow certain roles (from `User.role`) to add or edit companies, deals, etc. TwentyHQ has a robust roles/permissions system; while that is beyond our immediate scope, our API design should keep the door open. We might include an `owner_user_id` on Company/Deal as mentioned, and in endpoints ensure that either only admins can reassign owners or at least capture who is performing changes (for audit logs).

**5. Response Modeling:** Leverage **Pydantic/SQLModel** to shape output models that include new relationships. For example, a `CompanyDetail` model that nests a list of founders (`people: List[PersonRead]`), deals (`deals: List[DealRead]`), and tags. This can be used in GET endpoints or GraphQL resolvers. By explicitly modeling these, we avoid the frontend needing to hit multiple endpoints.

We must be careful to avoid circular references (e.g. Company includes Person includes Company); using `...` (ForwardRef) or carefully choosing which side includes the other (likely Company includes persons but Person’s company field may be excluded in that nested context to break recursion, or just include a company ID).

**6. Performance & N+1:** With more relations, we should optimize data loading:

- For REST, utilize eager loading via SQLModel/SQLAlchemy (e.g. `session.exec(select(Company).options(selectinload(Company.people), selectinload(Company.deals))...)` so that when we serialize a Company with nested people and deals, it doesn’t query per item).
- For GraphQL, use dataloaders or the `join` approach to batch fetch relations.
- Ensure indices are in place for foreign keys (SQLModel’s relationships automatically index FKs, e.g. company_id on Deal is indexed, we will index person.company_id, tag relations, etc.) to keep joins fast.

**7. Potential Microservice Split:** In the long run, as features grow, consider separating concerns:

- A **Search service** (or at least a dedicated module) could handle search queries across companies/people/deals, especially if we integrate a full-text search or ElasticSearch. Right now, a simple approach is using Postgres full-text indices. For instance, Twenty’s schema defines a TSVECTOR `searchVector` on Company and Person for full-text search on certain fields. We can emulate this by adding a generated tsvector column indexed by GIN, concatenating name, description, and perhaps founder names and tags. This way, the FastAPI endpoint `/search?q=...` can query this index for speedy results.
- A **Reporting/Analytics service** might gather metrics (number of deals per sector, timeline of interactions, etc.) without overloading the core API. However, initially we can implement analytics queries within the same app (with proper DB indices or caching).
- If needed, a separate **Tagging service** could be spun out if tags become complex (but likely not needed; a simple table is fine in core).

At this stage, a monolith with clear module boundaries is easiest to maintain. We use FastAPI’s router inclusion to mimic service separation. For example, mount a router for each major module (`companies.py`, `people.py`, `deals.py`, `tags.py`, etc. in `app/api/v1/`). This modular design makes it easier to later split them into separate services if scaling requires (since each could be run on its own path or FastAPI app).

## Indexing, Search, and Caching Strategies

**Tag & Full-Text Search:** Once companies, deals, and people can be tagged and have more text fields, implementing search is critical. We propose:

- Use **PostgreSQL Full-Text Search** for names, descriptions, and note content. As mentioned, we can add a `search_vector` column on key tables (Company, Person, Deal) that concatenates relevant text. This column is updated via triggers or computed columns whenever the underlying data changes. By indexing it (GIN index), we can perform fast `to_tsquery` lookups.
- Additionally, index foreign keys and tag links so filtering by tag is a simple indexed query (e.g. find all company_ids from company_tags where tag_id=X).
- For more advanced search (e.g. multi-field, fuzzy), consider integrating an external engine like **MeiliSearch or Elasticsearch**. This could run as a side service syncing from the DB. However, initially, Postgres text search plus well-chosen indexes should suffice for moderate data sizes.

**Caching Layer:** Redpill already has a sophisticated caching for external data (CompanyDataCache). We should extend caching to new internal queries if needed:

- **Frequently Accessed Data:** e.g. a list of all active deals or portfolio companies might be requested often. We could use Redis or an in-memory cache to store such results (with invalidation on data changes). However, since our data is relational and consistent, relying on DB indices and optimizing queries might be enough. Use caching primarily for expensive operations (AI analysis, external API calls – which is already done via SmartCache).
- **Widget Data Caching:** The widget system loads data like news, prices etc. Those are already cached via `RealtimeDataCache` for short term. We will continue using that for live data. For new widgets or analytics widgets (e.g. a chart of deals per quarter), consider pre-computing these in cache or materialized views.

**Analytics Tracking:** As requested, tracking usage per deal/person/company can be done by logging events (which we cover via the Activity log). For example, each time a user views a company profile, or adds a note to a deal, we insert an Activity. We could also maintain counters (views count, last viewed at) on the entities for quick access. If needed, a nightly job could aggregate these events for reporting (e.g. number of interactions this week per deal). Given our stack, this can be done via a background task (FastAPI’s `BackgroundTasks`) or a separate Celery/RQ worker if more intensive.

**Database Indices:** We will update migrations to add indexes on new fields:

- `Person.name` (for quick lookup by name or duplicates check)
- `Deal.contact_person_id`
- Tag tables on `(company_id, tag_id)` etc. (for fast existence checks and preventing duplicates via unique constraints if desired).
- Possibly partial indexes or filtered indexes, e.g. on Activity table by company_id or deal_id if it grows large, to speed filtering per entity.

**Historical Data Migration:** For existing Redpill data, we need to migrate:

- Founder info: if any exists in `enriched_data`, extract those names to create Person entries and link them to the company. We might initially only have names; later we can enrich those Person profiles with Tavily or manual input (e.g. use Tavily’s team info to fill Person details).
- Set each existing company’s founders. Companies without data remain with no Person until user adds.
- We’ll also have to create Tag entries for any implicit categories (e.g. Redpill’s `sector` field is currently a string enum; if we want to unify with tags, we might keep `sector` as a structured field and use tags for additional classifications).
- Ownership: if not tracking equity yet, no migration needed there.
- Ensure all `deal.created_by` link to a valid User (should already) and set those as owners if we want to initially consider creator as owner.

The migration (via Alembic) should add new tables (Person, Tag, etc.) and new columns safely (nullable where appropriate), so existing logic continues to run. Compatibility is maintained by not removing old fields immediately. For example, `Company.enriched_data` can be kept for now, but we’ll stop relying on it for founder info once Persons are in place. We might mark it deprecated and later drop it after UI fully switches to the new model.

## Extensible Widget-Based Architecture

One of Redpill’s standout features is its widget-based company profile UI (e.g. NewsWidget, TokenPriceWidget, etc.). To keep this robust and extensible:

- **API for Widgets:** Rather than tightly coupling widget logic in the frontend only, provide backend endpoints that supply the data for each widget in a standardized way. For instance, a `/companies/{id}/widgets/{widget_name}` endpoint could return data for that widget. Currently, the `CompanyDataService.fetch_company_data_parallel()` already fetches multiple data types in one go, and the frontend decides how to use it. We should document clearly what data is available (profile, team, funding, market, etc.) and ensure adding a new category (say a new widget for “Social Media sentiment”) is as simple as adding a new data type in the service and exposing it.
- **Modular Data Fetchers:** Internally, structure each widget’s data retrieval as a separate function/service. Redpill does this to an extent: e.g. Tavily provides profile/team/funding, CoinGecko for prices, OpenBB for financials. We should continue that pattern. If a new widget “Competition analysis” is needed, we’d add a `fetch_company_competition()` method (and perhaps a new cache field) without disrupting other parts. Use consistent patterns for these (parallel fetch with asyncio, caching results, etc., as already implemented).
- **Ensure Backward Compatibility:** The widget system likely expects certain JSON shapes in `Company.enriched_data`, `market_data`, etc. If we refactor those into structured tables, we might need to adapt the WidgetManager on the frontend. For now, we can **keep storing widget data in JSON columns** (or in the cache table) but concurrently build out structured data. Best practice would be to migrate towards serving widget data on-demand via endpoints rather than persisting all of it in the Company record. For example, when the frontend opens a company page, it calls `/companies/{id}/parallel?data_types=[profile,team,funding,news]` which returns a payload of all needed info. This stateless fetch (cache-backed) is good – we should maintain that approach. We just need to update it to draw founder info from the new Person table (instead of solely Tavily’s text extraction) and similarly use structured fields where possible.
    - E.g. **Team widget:** After migration, the “team” data can be composed from Person entries in our DB (with perhaps augmentation from Tavily if we lack some info). So `company_data_service` would merge DB Person records (the ones user confirmed/added) with Tavily’s findings for any missing people. This blend ensures the data is robust and user-editable.
- **Extensibility:** To add a new widget in the future, the steps should be: (a) add any new fields or tables needed, (b) add a function in data service to fetch/cache that data, (c) add a route or extend `/parallel` to include that data type, (d) frontend adds a widget component reading from the same. Document this process for consistency. It might help to define a **Widget interface** in code – e.g. a base class each widget data provider implements, ensuring methods like `fetch_data(company)` and specifying a `data_type` name. Though not strictly necessary, it can impose uniformity.
- **Isolation and Fault Tolerance:** Each widget’s data fetch should be isolated so that a failure in one (say a slow API for news) doesn’t break the whole page. Redpill’s parallel fetch with asyncio and background tasks already addresses this – it returns cached data immediately and refreshes in background for next time. We will continue to use that pattern. Additionally, log errors per widget fetch but allow others to succeed (e.g. if OpenBB fails to return some metric, just omit that widget’s update rather than failing the entire request).
- **UI Configuration:** Although frontend-focused, mention that we can make widgets configurable (which ones to show or not) per user or per company type. For example, only show TokenPriceWidget for companies marked as `CRYPTO`. The backend can assist by providing metadata (company type) so the frontend knows which widgets are relevant. This is already partly done via `Company.company_type` (PUBLIC/CRYPTO/PRIVATE) which the frontend uses to decide which data to show. We’ll continue this practice. As we add new company-related features (like if a company has custom fields via tags or related objects), we can create widgets to surface those too.

## Scalable Architecture and Service Separation

To ensure the system remains modular and scalable as we introduce these features:

- **Domain-Driven Modules:** Group functionality by domain (Company, Deal, Person, etc.). Each module encompasses its model, DAO (if any), service, and router. This makes the codebase easier to navigate and allows future splitting into microservices. For instance, a `people.py` router and service can later become a standalone “contacts service” if needed without major refactoring.
- **Background Tasks & Celery:** Some new features (analytics aggregation, sending alerts on certain events, heavy computations) might benefit from background processing. We can integrate a task queue (Celery or FastAPI’s built-in background tasks for simpler cases) to handle things like: nightly computing portfolio analytics, generating an investment history report, or sending notification emails from the Activity logs (e.g. notify a user when a deal moves stages). Offloading these ensures the core API stays responsive.
- **Use of Caching and Pub/Sub:** To keep things in sync if we did separate services, use Redis both as a cache and a message broker (since Redis is already in stack). For example, if the Tag service was separate, when a tag is added it could publish an event that the Search service picks up to re-index that company’s tags. In the monolith, we can simulate this with function calls; but designing with an event-driven mindset now will ease a future migration to an event bus architecture.
- **Scalability Considerations:** With more relations, query counts will increase. We should load-test critical endpoints (e.g. loading a full company profile with 10 founders, 5 deals, 20 tags, etc.) to ensure the DB queries are optimized. If needed, add **caching at the API layer** for expensive endpoints (e.g. cache a company profile response JSON for a short time since it doesn’t change often, and bust on updates).
- **Pagination & Limits:** For lists of deals, people etc., implement pagination in endpoints (FastAPI can use LimitOffset or cursor-based). This prevents large data dumps from slowing the service. E.g. if a company somehow had 1000 people (in big organizations), we wouldn’t always send all.

## Incremental Migration Roadmap

Implementing these enhancements without disrupting current users requires a phased approach:

**Phase 1: Database Extensions .** Use Alembic to add new tables and columns:

- Create `person` table, `tag` table, join tables (`company_tags`, etc.), `ownership` table (if included), `activity` table.
- Add new columns: `company.owner_user_id`, `deal.contact_person_id`, `company.created_by` (if missing).
- Ensure all new FKs have indices. Write migrations so that new columns are nullable and new tables empty initially.
- **No changes to existing logic yet** – old endpoints still work, ignoring these new structures.

**Phase 2: Backend Model & Service Implementation .** Update the SQLModel models to reflect new schema. Implement new FastAPI routes and service methods:

- Person CRUD and linking (e.g. an endpoint to add a founder to a company which creates a Person and sets company_id).
- Tag CRUD and assignment endpoints.
- Extend Company and Deal endpoints to expose related data (possibly behind a query param or in a new versioned API namespace `/api/v2/` to avoid surprising existing API clients).
- Write unit tests for new services (e.g. adding a tag, retrieving a company with founders).
- During this phase, the frontend might not yet use these new endpoints, but we ensure they work.

**Phase 3: Data Migration & Sync .** Backfill existing data:

- Write a migration script to extract any founder names from `Company.enriched_data` (if present) and create Person entries. If `enriched_data.founders` exists, create Person(s) with that name, link to company. Mark these as auto-imported (maybe via a boolean field or source note) so users can verify/edit them.
- Migrate any other relevant info (if we had a JSON of investors somewhere, migrate to ownership, etc.).
- Inform the team that new fields are available for input (e.g. when adding a company, you can now add multiple founders via UI).

**Phase 4: Frontend Integration.** Work with front-end team (if separate) to utilize new API:

- Update the company profile page to display founders from the Person API instead of from the raw enriched_data. Provide UI to add/remove founders which calls the new endpoints.
- Add UI for tagging companies/deals (e.g. a multi-select dropdown of tags powered by `/tags` API).
- Ensure deal forms can select a primary contact person (from that company’s people or add new).
- This phase might be iterative: enable a feature, get user feedback, refine.

**Phase 5: Deprecation and Cleanup :** Once the new features are stable:

- Deprecate old usage of enriched_data for founders. Perhaps repurpose `enriched_data['founders']` to store raw suggestions from Tavily only, while actual confirmed founders are in Person table. Eventually, we can drop or ignore that part of JSON.
- Update documentation (both code docs and any user-facing docs) to reflect new data model.
- If any scripts or analysis notebooks depended on old schema, update them.

**Phase 6: Further Enhancements:** After initial migration, evaluate and address any remaining needs:

- Implement additional audit logs if needed (e.g. track changes to key fields like valuation in a history table similar to deal status history).
- Optimize query performance based on monitoring (add indexes or caching where bottlenecks appear).
- Consider enabling GraphQL API if not done, as an enhancement once the underlying schema is robust.

Throughout the migration, we maintain backward compatibility. The existing API responses shouldn’t break: for example, `CompanyRead` model can remain the same initially. We might introduce a new `CompanyReadExtended` for when `include=people` is requested, or simply always include an empty `people: []` field to start with so the frontend can handle it gradually. Similarly, tag information can be optional until frontend is ready.

We will also write **tests** for each new feature and run regression tests to ensure existing functionality (like adding a deal, editing a company) still works as before.

## Conclusion

By borrowing concepts from Twenty’s rich CRM model – standard objects like Company, Person, Opportunity with clear relations – we can transform RedpillAI’s backend into a more powerful, scalable platform. The new schema supports multiple founders per company, tag-based classification, detailed interaction logs, and better ownership tracking, addressing the needs of a venture CRM. The FastAPI service layer, structured into domain modules and possibly augmented with GraphQL, will make the API more flexible and future-proof.

Crucially, these changes are designed to be incremental and maintainable. We avoid a ground-up rewrite; instead, we **extend the existing schema** and **refactor APIs gradually**. This ensures Redpill’s current features (AI Copilot, OpenBB data, etc.) continue to function throughout the transition. As a result, the RedpillAI platform will be able to handle more complex venture workflows (e.g. managing many stakeholders in a deal, tracking portfolio performance over time, searching across a rich contact database) without sacrificing performance or developer agility.

By following this proposal – with careful planning, thorough testing, and inspiration from a proven model like TwentyHQ – RedpillAI can confidently evolve from a basic CRM to a **full-fledged venture CRM system** that remains **robust, extensible, and scalable** for future needs.

## Sources

- TwentyHQ Open-Source CRM schema (Selected excerpts):
    - Person and Company relationships
    - Opportunities (deals) linked to Company and Person
    - “Account Owner” internal user assignment
    - Timeline activity linkage
- RedpillAI Current Schema and Architecture:
    - Company model (pre-refactor)
    - Deal model and status history
    - Tavily enrichment returning founders list (unstructured)
    - Data fetch API (parallel widget loading)