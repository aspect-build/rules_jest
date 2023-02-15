export default function Link({ page, children }) {
  return <a href={page || "#"}>{children}</a>;
}
