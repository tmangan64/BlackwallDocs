# AI

The Blackwall also plays host to a locally-hosted LLM stack.

The following software is notes for future use:

| Software name | Purpose                        |
| ------------- | ------------------------------ |
| OpenCode      | Web interaction                |
| OpenWebUI     | Code interaction               |
| Ollama        | Local LLM hosting              |
| Aperture      | Tailscale AI gateway           |
| llmfit        | Hardware compatibility checker |
| Graphify      | AST generator                  |
| FreeToken     | Token optimisation engine      |
| Sec-context   | Security hardening             |
| Heretic       | Abliteration                   |

---

# Alt

The Blackwall hosts a local abliterated LLM model against a custom-built harness, creating Alt.

Alt's primary directive is assisting with the maintenance and development of the Blackwall network and associated hosts. This is achieved by modes:

### Scheming

This mode will have Alt plan a project or implementation such as new module for a host. It involves checking dependency security and planning the logic of the new implementation.

If the conversation relates to an already existing project such as a NixOS config, the scheming mode also allows Alt to generate an AST from the repository, and querying that instead of grepping files, saving up to 80% in tokens.

Scheming mode produces a `DIRECTIVE.md` file containing instructions for development mode as well as how to setup a devenv.sh environment.

Scheming mode has external internet access for research and documentation fetching but under strict security guidance on which sites it can and cannot visit. `http` is insecure and banned by default for example.

### Development

Development mode typically immediately follows scheming mode and has Alt follow the instructions laid out by the Scheming mode such as setting up the devenv.sh environment as well as the structure of the implementation.