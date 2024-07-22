const data = [
  {
    name: "Broadcom Inc.",
    children: [
      {
        name: "VMware Inc.",
        children: [
          {
            name: "Bitnami",
          },
        ],
      },
    ],
  },
  {
    name: "Cisco Systems Inc.",
  },
  {
    name: "HP Inc.",
  },
];
export default function InformationTechnology() {
  return (
    <>
      <h1>Information Technology</h1>
      <TreeList item={data} />
    </>
  );
}

function TreeList({ item }) {
  return (
    <ul>
      {item.map((item) => (
        <li>
          {item.name}
          {item.children && <TreeList item={item.children} />}
        </li>
      ))}
    </ul>
  );
}
