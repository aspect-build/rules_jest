test("snapshots resolve correctly with a slashed target name", () => {
  expect({ value: 16 }).toMatchSnapshot();
});
