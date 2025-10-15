import { gql } from "@apollo/client";

export const LIST_PROJECTS = gql`
  query ListProjects {
    listProjects {
      id
      name
      createdAt
      updatedAt
    }
  }
`;
