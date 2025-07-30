# Designing a Company Profile Data System for RedPill VC

Building on RedPill VC’s current **frontend, AI agent, and backend design**, we can add robust company profiles with both structured data and unstructured knowledge. The goal is to gather **company basics, team, competitors, market data, financial metrics (stock/crypto prices, valuations, ARR)**, and support user-uploaded documents (pitch decks, memos, etc.) for each company. Below are technical suggestions for designing this system:

## Integrating Data Sources for Company Profiles

* **OpenBB Financial Data** – Leverage the existing OpenBB integration to fetch market and financial data. For **public companies**, use OpenBB’s equity endpoints (e.g. Yahoo Finance via OpenBB) to get stock quotes, financial overviews, and fundamentals. For **crypto projects**, utilize OpenBB’s crypto price API or CoinGecko to get token prices and market cap data. This provides up-to-date price info (stock or token) and key metrics for each company profile.

* **Crunchbase/PitchBook for Profiles** – Integrate external APIs like **Crunchbase** or **PitchBook** (if available) to pull company profile details: founding date, description, team members, competitor list, funding rounds, and valuations. These services can supply *team and competitor info* not covered by OpenBB. For example, call Crunchbase API when enriching a company to retrieve its key people and competitors. The backend’s `enrich_company_data` function already anticipates adding **Crunchbase for startup data** and **LinkedIn for team info** – you can implement those calls here.

* **Automated Enrichment Workflow** – On creating or updating a company profile, trigger an enrichment routine:

  1. **Basic Info & Website Scrape:** Use the company’s domain to scrape the website for clues on founding year, employee count, etc (the backend already does a simple HTML parse to guess these).
  2. **Financial Data:** If company type is *“traditional”* (public), fetch stock ticker and fundamentals via OpenBB or Yahoo. If *“crypto”*, get token data via CoinGecko/OpenBB. If *private*, skip market data but rely on Crunchbase for funding/valuation.
  3. **Team & Competitors:** Query Crunchbase for the list of founders/executives and known competitors. Store these in the profile.
  4. **Metrics:** Calculate or record metrics like ARR, revenue, etc. If not directly available, use heuristics. (E.g. the backend currently estimates ARR by multiplying revenue by 12 or uses sector-based assumptions.)
  5. **Cache & Update:** Cache external data results (e.g. using Redis) to avoid repeated API calls. Save all fetched info into the database.

By combining OpenBB for market/finance data and Crunchbase/PitchBook for company info, each profile will have comprehensive data from **both internal and external sources**.

## Data Storage and Company Knowledge Base

* **Primary Database (Postgres)** – Extend the **Company** model/schema to store the new structured fields. The `Company` table should include fields like description, sector, stage, founding year, employee count, latest valuation, ARR, etc., as well as relational links to *team members* and *competitors*. For example, have a `CompanyTeamMember` table (with name, role, maybe LinkedIn URL) and a `CompanyCompetitor` table that references other companies. This structured data lives in Postgres for fast retrieval.

* **File Storage (S3)** – Save uploaded files (pitch decks, memos, CSVs, PDFs) in an object store like S3, organized by company ID. When a user uploads documents via the frontend, the files are sent to the backend and stored in S3 (or another blob storage). Keep metadata in the database (file name, type, upload date, associated company). This forms a **“Data Room”** for each company containing all relevant documents.

* **Indexing Documents** – Upon upload, **process the file content** for the knowledge base:

  * Parse text from PDFs, Word docs, and text-based files (using libraries like PyMuPDF or PDF.js for PDF, CSV readers for spreadsheets).
  * **Chunk** the text into semantic sections (e.g. paragraphs or slides) to prepare for embedding.
  * Use an **embedding model** to vectorize each chunk of text, capturing semantic meaning. (This could use OpenAI’s embeddings or a local model, depending on privacy needs.)
  * Store these embeddings in a **Vector Database**, with metadata tags for company and document source. This ensures each company’s knowledge base is searchable by semantic meaning.

All the raw data (profile fields and file content) is thus stored: structured facts in Postgres, documents in S3, and semantic indexes in the vector DB. This separation lets the **frontend widgets** query structured data quickly, while the **AI agent** can perform semantic searches on documents.

## Vector Database for Retrieval (RAG)

* **Choice of Vector DB** – Use a **local or self-hosted vector database** to keep control over data (to comply with privacy). RedPill’s architecture already envisions a vector DB (using Pinecone in the reference design). You could replace Pinecone with an open-source alternative (like **FAISS, Qdrant, Weaviate**, or Chroma) deployed alongside the backend for self-hosting. The key is to ensure the AI service can query this DB for relevant text snippets.

* **Embedding Pipeline** – When new documents are added or existing ones change, update the vector index:

  * Compute embeddings for each text chunk (e.g. using a transformer model).
  * **Upsert** these into the vector store with a compound key like `company_id:doc_id:chunk_index` and metadata (`company_id`, `doc_type`, etc.).
  * For large documents, consider doing this asynchronously (Celery worker task) so it doesn’t slow down the upload API response.

* **Semantic Search API** – Provide a backend endpoint (e.g. `GET /companies/{id}/knowledge_search?q=<query>`) that queries the vector DB for a given company’s top **N** relevant chunks. This API will use the query embedding to find similar vectors and return the text snippets or summaries. The **AI agent** or frontend can call this to retrieve supporting knowledge.

* **Data Scope** – The vector search should be scoped **per company**, so the AI doesn’t mix content from different companies. Use the metadata filter (company\_id) on vector queries to ensure results come from the right company’s knowledge base. This way, each company’s uploaded files and notes are isolated in the semantic index.

By maintaining a vector index of company documents, we enable **Retrieval-Augmented Generation (RAG)**: the AI can pull in exact information from pitch decks, memos, etc., when answering questions. This dramatically improves accuracy for company-specific queries.

## AI Agent Integration with RAG

* **Context Injection for Chat** – Integrate the vector search results into the AI assistant’s workflow. When the user asks a question about a particular company, the system should fetch relevant data from:

  1. **Structured DB**: Key facts (valuation, ARR, team count, etc.) from Postgres.
  2. **Vector DB**: Any textual knowledge (e.g. a snippet from the pitch deck or memo) via semantic search.

  These can be combined into a “context” passed to the AI model. For example, before generating a response, the backend could compile a brief context section:

  * *“**Company Basics:** Founded 2018 in SF, 50 employees, Series B, \$100M valuation, ARR \~\$5M. Competitors include X and Y.*
    **Key Doc Excerpts:** \[Snippet from pitch deck about product differentiation] … \[Quote from investment memo about growth] …”\*

* **AI Tools & Agents** – Alternatively, use the agent tooling system (AG-UI Protocol) to let the AI *call tools* for data. RedPill already defines agent capabilities and tools like `"openbb_data"` and `"crunchbase_search"`. We can add a **“knowledge\_base\_search”** tool that the agent can invoke with a company context. This tool would call the backend’s vector search API and return the results for the agent to use. This dynamic approach means the AI decides when it needs to retrieve documents. For example, if the user asks *“What are the biggest challenges mentioned in the pitch deck?”*, the agent triggers a knowledge\_base\_search, gets the relevant text from that deck, and then forms its answer citing those points.

* **Merging with OpenBB Data** – Ensure the AI agent can use both the **financial data** and the **document knowledge**:

  * For market/financial queries (e.g. “What’s the current stock price or token price?”), the agent uses OpenBB data (as it does now).
  * For due-diligence or qualitative queries (e.g. “Describe the team’s background” or “Summarize their competitive advantage”), the agent should rely on Crunchbase info and uploaded docs. This may involve directly pulling the “team” field from the DB or searching any team bios in the documents.

  The agent’s response can be a blend of these: facts from the structured profile plus insights from documents, all **grounded in real data** retrieved via RAG. The AG-UI event-driven model supports streaming these tool results to the frontend in real time.

* **RAG Flow** – In practice, the **AI Service** component will interface with the vector DB to get relevant context. One approach is to implement a retrieval-augmented chain (as in LangChain):

  1. Receive user question and the current company ID.
  2. Do a vector similarity search for that question within the company’s docs.
  3. Prepend the top results as system or context messages for the LLM (or feed it through the agent’s tool as above).
  4. Also include any high-level company info from the DB.
  5. **Then** have the LLM generate the answer, which will naturally use the provided context to give specific, accurate replies.

By designing the AI agent to incorporate this retrieved knowledge, **company-specific Q\&A becomes far more accurate**. The assistant essentially has a private knowledge base per company to draw from, in addition to live financial data.

## Frontend UI/UX Considerations

* **Company Profile Page** – Extend the frontend to display all the collected data for a company:

  * Show **basic info** (description, sector, stage, logo, etc.) at the top.
  * List **team members** with names and titles.
  * List **competitors** (possibly as clickable items if those competitors are also in the system).
  * Include key **metrics widgets** – e.g. *valuation, ARR, revenue growth, burn rate*. These could be small cards or charts. (The system can use the enriched data in `company.metrics` to populate these.)
  * If the company is **public or crypto**, embed a **price chart widget**: for example, fetch the latest price and a mini historical chart via OpenBB (similar to the existing `OpenBBDataroom` for crypto). This gives a quick view of stock/token performance.
  * Provide a **“Data Room”/Documents section**: show a list of uploaded files (name, type, upload date). Users can click to download or preview them. This section confirms what knowledge is available for AI to use.

* **File Upload Interface** – On the company page, allow authorized users to upload new documents. This could be a drag-and-drop area or an “Add Document” button. The frontend will call an API (e.g. `POST /companies/{id}/documents`) to upload the file. Show upload progress and, upon completion, update the documents list. Optionally, indicate when a file’s text has been indexed for AI (e.g. a status icon if processing is pending vs. done).

* **AI Chat Context** – In the chat UI, tie the conversation context to the selected company:

  * If the user has navigated to a company’s page or selected a company project, pass the `company_id` or project info to the chat component (the code already passes `currentProject` to the OpenBB assistant chat).
  * Visually, you might show the company’s name or logo in the chat header to remind the user which context is active.
  * When the AI responds, it can cite sources or data points. For instance, if it quotes a line from the pitch deck, it might reference that document by name in the answer (or even provide a snippet with quotes).
  * Keep the chat **multi-modal**: the AI could reference both the structured data (“As of the last funding round in 2023, valuation is \$500M”) and unstructured (“According to the investment memo, *‘growth has been 120% YoY’*”). Combining these makes the answers richer and more trustworthy.

* **Widget DataPoints** – With all company data available, the frontend can offer interactive widgets:

  * **Charts**: If ARR or revenue over time is available (perhaps via CSV or manual input), render a line chart. If not, at least display the current ARR value in a card.
  * **Comparisons**: Using competitor data, perhaps show a side-by-side comparison widget (e.g. Company vs Competitor on key metrics).
  * **Market Context**: For crypto companies, the “Financial Dataroom” (OpenBB Dataroom) could highlight overall market trends (BTC/ETH prices) to give context. For traditional companies, maybe pull an index or sector performance chart.
  * These widgets can reuse the existing UI components (cards, badges, charts) and fetch data from the backend’s API (e.g., an endpoint could provide time-series for revenue if available).

* **Security & Permissions** – Since sensitive data is involved (internal memos, etc.), ensure that only authorized users can access each company’s data. The backend APIs (companies, documents, vector search) should check the user’s auth and role. Frontend should hide or disable upload/download features for unauthorized users. Using **per-company access control** will be important.

In summary, the system will consist of:

* **Backend enhancements** to aggregate company info from OpenBB + Crunchbase, store it in Postgres, handle file uploads to S3, and index content in a vector DB.
* **AI service integration** to include RAG: querying that vector DB for relevant knowledge during chat, alongside real-time market data from OpenBB.
* **Frontend updates** for a richer company profile page (data widgets, team, competitors, docs) and a context-aware chat UI.

By following this design, each company profile becomes a rich **hub of data**. The AI assistant can then act as an informed analyst, utilizing both up-to-the-minute financial data and the company’s own documents to answer questions. This aligns well with RedPill’s architecture, which already emphasizes a modular AI agent layer, an integrated OpenBB data layer, and the use of a vector database for smart retrieval. The result will be a powerful, AI-enhanced **investor portal** where all relevant information about a portfolio company is at the user’s fingertips – whether via interactive dashboards or through natural language Q\&A.

**Sources:**

* RedPill VC Architecture Guide – *Data layers and integrations*
* RedPillAI Backend – *Company enrichment logic (crypto vs traditional, data sources)*
* RedPillAI Backend – *Estimation of metrics and ARR*
* RedPillAI OpenBB Service – *Market data and fundamentals fetching*
* RedPillAI Frontend – *OpenBB Dataroom component (market data example)*
* RedPillAI Frontend – *AI assistant usage of project context*
* RedPillAI Docs – *AG-UI agent integration and tools (openbb, crunchbase, etc.)*
