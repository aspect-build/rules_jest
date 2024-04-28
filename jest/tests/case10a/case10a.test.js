test("the config + setup files run", () => {
  expect(TEST_SETUP_VALUE).toEqual(42);
  expect(TEST_SETUP_VALUE).toMatchSnapshot();

  expect(TEST_CONFIG_VALUE).toBe(true);
  expect(TEST_CONFIG_VALUE).toMatchSnapshot();

  expect(TEST_CONFIG_INIT_VALUE).toBe(true);
  expect(TEST_CONFIG_INIT_VALUE).toMatchSnapshot();
});
