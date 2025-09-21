# .credo.exs
%{
  configs: [
    %{
      name: "default",
      files: %{
        included: ["lib/", "test/", "config/"],
        excluded: [~r"/_build/", ~r"/deps/"]
      },
      strict: true,
      color: true,
      checks: [
        {Credo.Check.Readability.ModuleDoc, false},
        # defaults to 120
        {Credo.Check.Readability.MaxLineLength, [max_length: 100]},
        {Credo.Check.Design.TagTODO, [exit_status: 0]},
        {Credo.Check.Refactor.MapInto, []},
        # sort alias/import blocks
        {Credo.Check.Readability.AliasOrder, []},
        # avoid single-item {..}
        {Credo.Check.Readability.UnnecessaryAliasExpansion, []},
        # e.g. `_user` vs `_`
        {Credo.Check.Consistency.UnusedVariableNames, [force: :meaningful]},
        {Credo.Check.Consistency.LineEndings, []},
        {Credo.Check.Consistency.SpaceAroundOperators, []}
      ]
    }
  ]
}
