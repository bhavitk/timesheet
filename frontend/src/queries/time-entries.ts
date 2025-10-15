import { gql } from "@apollo/client";

export const GET_TIME_ENTRIES = gql`
  query GetTimeEntries($month: Float!, $year: Float!) {
    getTimeEntries(month: $month, year: $year) {
      id
      date
      hours
      description
      entryType
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_TIME_ENTRY = gql`
  mutation CreateTimeEntry($input: CreateTimeEntryInput!) {
    createTimeEntry(input: $input) {
      id
      date
      hours
      description
      entryType
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TIME_ENTRY = gql`
  mutation UpdateTimeEntry($input: UpdateTimeEntryInput!) {
    updateTimeEntry(input: $input) {
      id
      date
      hours
      description
      entryType
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_TIME_ENTRY = gql`
  mutation DeleteTimeEntry($id: String!) {
    deleteTimeEntry(id: $id) {
      id
    }
  }
`;

// Admin queries for reports
export const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers {
      id
      email
      firstName
      lastName
      createdAt
    }
  }
`;

export const GET_USER_TIME_ENTRIES_ADMIN = gql`
  query GetUserTimeEntriesAdmin(
    $userId: String!
    $month: Float!
    $year: Float!
  ) {
    getUserTimeEntriesAdmin(userId: $userId, month: $month, year: $year) {
      id
      date
      hours
      description
      entryType
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_USERS_TIME_ENTRIES_REPORT = gql`
  query GetAllUsersTimeEntriesReport($month: Float!, $year: Float!) {
    getAllUsersTimeEntriesReport(month: $month, year: $year) {
      userId
      userEmail
      userFirstName
      userLastName
      entries {
        id
        date
        hours
        description
        entryType
        createdAt
        updatedAt
      }
    }
  }
`;
