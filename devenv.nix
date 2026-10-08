{ pkgs, ... }:

{
  packages = with pkgs; [
    git
    mdbook
    prettier # formats the markdown sources
  ];

  scripts = {
    dev.exec = "mdbook serve --open";
    build.exec = "mdbook build";
    serve.exec = "mdbook serve";
    clear.exec = "mdbook clean";
  };

  # `devenv up` runs the dev server with live reload
  processes.mdbook.exec = "mdbook serve";

  enterShell = ''
    echo "BlackwallDocs - $(mdbook --version)"
    echo "  dev / build / serve / clear   (or devenv up)"
  '';
}
