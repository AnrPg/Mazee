# .credo.exs
%{
  configs: [
    %{
      name: "default",
      files: %{included: ["lib/", "test/", "config/"], excluded: [~r"/_build/", ~r"/deps/"]},
      strict: true,
      color: true,
      checks: [
        {Credo.Check.Readability.ModuleDoc, false},
        {Credo.Check.Readability.MaxLineLength, max_length: 100},
        {Credo.Check.Design.TagTODO, exit_status: 0},
        {Credo.Check.Refactor.MapInto, []},
        {Credo.Check.Warning.UnusedAlias, []},
        {Credo.Check.Warning.UnusedImport, []},
        {Credo.Check.Warning.UnusedVariable, []},
        {Credo.Check.Consistency.LineEndings, []},
        {Credo.Check.Consistency.SpaceAroundOperators, []}
      ]
    }
  ]
}
