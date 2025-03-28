import React, { useEffect, useState } from "react";
import {
  getTasks,
  getUsers,
  assignTask,
  deleteTask,
  getUserById,
  updateTaskStatus,
  getProject,
} from "../../../../../api";
import { useParams, useNavigate } from "react-router-dom";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDProgress from "components/MDProgress";
import DataTable from "examples/Tables/DataTable";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput"; // Importez MDInput pour le champ de recherche

// Material Dashboard 2 React layout components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Material Dashboard 2 React example components
import CircularProgress from "@mui/material/CircularProgress";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

// Spinner component
import Spinner from "examples/Spinner";

function TaskList() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]); // Tâches filtrées
  const [searchQuery, setSearchQuery] = useState(""); // État pour la recherche
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [project, setProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    document.title = "Liste des Tâches";
    fetchProjectDetails();
    fetchTasks();
    fetchUsers();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const projectData = await getProject(id);
      setProject(projectData);
    } catch (err) {
      setError("Erreur lors de la récupération des détails du projet");
    }
  };

  const fetchTasks = async () => {
    try {
      const data = await getTasks(id);
      const tasksWithUsers = await Promise.all(
        data.map(async (task) => {
          if (task.assignedTo) {
            try {
              const user = await getUserById(task.assignedTo);
              return { ...task, assignedUser: user.name };
            } catch {
              return { ...task, assignedUser: "Utilisateur inconnu" };
            }
          }
          return { ...task, assignedUser: null };
        })
      );

      // Trier les tâches par priorité (haute priorité en premier)
      tasksWithUsers.sort((a, b) => {
        const priorityOrder = ["Haute", "Moyenne", "Basse"];
        return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
      });

      setTasks(tasksWithUsers);
      setFilteredTasks(tasksWithUsers); // Initialiser les tâches filtrées
    } catch (err) {
      setError("Erreur lors de la récupération des tâches");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError("Erreur lors de la récupération des utilisateurs");
    }
  };

  // Filtrer les tâches en fonction de la recherche
  useEffect(() => {
    const filtered = tasks.filter((task) =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTasks(filtered);
  }, [searchQuery, tasks]);

  const handleAssignTask = async (taskId, userId, id) => {
    try {
      await assignTask(taskId, userId, id);
      alert("Tâche assignée avec succès");
      fetchTasks();
    } catch (err) {
      alert("Erreur lors de l’assignation de la tâche");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette tâche ?")) {
      try {
        await deleteTask(taskId);
        alert("Tâche supprimée avec succès");
        setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
      } catch (err) {
        alert("Erreur lors de la suppression de la tâche");
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
      alert("Statut de la tâche mis à jour avec succès");
      fetchTasks();
    } catch (err) {
      alert("Erreur lors de la mise à jour du statut");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const completionPercentage =
    (tasks.filter((task) => task.status === "Terminée").length / tasks.length) * 100;

  const columns = [
    { Header: "Tâche", accessor: "task", width: "30%", align: "left" },
    { Header: "Statut", accessor: "status", align: "center" },
    { Header: "Priorité", accessor: "priority", align: "center" },
    { Header: "Date limite", accessor: "deadline", align: "center" },
    { Header: "Assigné à", accessor: "assignedTo", align: "center" },
    { Header: "Progression", accessor: "completion", align: "center" },
    { Header: "Actions", accessor: "actions", align: "center" },
  ];

  const rows = filteredTasks.map((task) => ({
    task: (
      <MDTypography
        variant="button"
        fontWeight="medium"
        onClick={() => setSelectedTask(task)}
        style={{ cursor: "pointer" }}
      >
        {task.name}
      </MDTypography>
    ),
    status: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {task.status}
      </MDTypography>
    ),
    priority: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {task.priority}
      </MDTypography>
    ),
    deadline: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {task.deadline ? formatDate(task.deadline) : "Non définie"}
      </MDTypography>
    ),
    assignedTo: (
      <MDBox>
        {task.assignedUser ? (
          <MDTypography variant="caption" color="text" fontWeight="medium">
            {task.assignedUser}
          </MDTypography>
        ) : role === "admin" ? (
          <Select
            defaultValue=""
            onChange={(e) => handleAssignTask(task._id, e.target.value, id)}
            sx={{ width: "100%", fontSize: "0.875rem" }}
          >
            <MenuItem value="">Sélectionner un utilisateur</MenuItem>
            {users
              .filter((user) => user._id !== task.assignedTo)
              .map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name}
                </MenuItem>
              ))}
          </Select>
        ) : (
          <MDTypography variant="caption" color="text" fontWeight="medium">
            Non assigné
          </MDTypography>
        )}
      </MDBox>
    ),
    completion: (
      <MDBox display="flex" alignItems="center">
        <MDTypography variant="caption" color="text" fontWeight="medium">
          {task.status === "Terminée" ? "100%" : "0%"}
        </MDTypography>
        <MDBox ml={0.5} width="9rem">
          <MDProgress
            variant="gradient"
            color={task.status === "Terminée" ? "success" : "info"}
            value={task.status === "Terminée" ? 100 : 0}
          />
        </MDBox>
      </MDBox>
    ),
    actions: (
      <MDBox display="flex" gap={1}>
        {task.assignedTo === userId && (
          <>
            <MDButton
              variant="gradient"
              color="warning"
              size="small"
              onClick={() => handleStatusChange(task._id, "En attente")}
            >
              En attente
            </MDButton>
            <MDButton
              variant="gradient"
              color="info"
              size="small"
              onClick={() => handleStatusChange(task._id, "En cours")}
            >
              En cours
            </MDButton>
            <MDButton
              variant="gradient"
              color="success"
              size="small"
              onClick={() => handleStatusChange(task._id, "Terminée")}
            >
              Terminée
            </MDButton>
          </>
        )}

        {role === "admin" && (
          <>
            <MDButton
              variant="gradient"
              color="warning"
              size="small"
              onClick={() => navigate(`/update-task/${task._id}`)}
            >
              Mettre à jour
            </MDButton>
            <MDButton
              variant="gradient"
              color="error"
              size="small"
              onClick={() => handleDeleteTask(task._id)}
            >
              Supprimer
            </MDButton>
          </>
        )}
      </MDBox>
    ),
  }));

  if (error) return <div className="text-center text-danger">{error}</div>;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <MDBox
          mx={2}
          mt={-3}
          py={3}
          px={2}
          variant="gradient"
          bgColor="info"
          borderRadius="lg"
          coloredShadow="info"
        >
          <MDTypography variant="h6" color="white">
            Détails du Projet
          </MDTypography>
        </MDBox>
        <MDBox pt={3}>
          {loading ? ( // Afficher le spinner si les données sont en cours de chargement
            <Spinner />
          ) : (
            <>
              {project && (
                <MDBox mb={4} p={3} boxShadow={3} borderRadius="lg">
                  <MDBox display="flex" justifyContent="space-between" alignItems="center">
                    <MDBox>
                      <MDTypography variant="h5">{project.name}</MDTypography>
                      <MDTypography variant="body2" color="text">
                        {project.description}
                      </MDTypography>
                      <MDTypography variant="body2" color="text">
                        <span style={{ fontWeight: "bold", color: "red" }}>
                          Échéance : {formatDate(project.deadline)}
                        </span>
                      </MDTypography>
                    </MDBox>
                    <MDBox position="relative" display="inline-flex">
                      <CircularProgress
                        variant="determinate"
                        value={completionPercentage}
                        size={100}
                        thickness={5}
                        color={completionPercentage === 100 ? "success" : "info"}
                      />
                      <MDBox
                        top={0}
                        left={0}
                        bottom={0}
                        right={0}
                        position="absolute"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <MDTypography variant="h6" color="text">
                          {`${Math.round(completionPercentage)}%`}
                        </MDTypography>
                      </MDBox>
                    </MDBox>
                  </MDBox>
                </MDBox>
              )}

              {/* Champ de recherche */}
              <MDBox mb={3}>
                <MDInput
                  fullWidth
                  placeholder="Rechercher une tâche..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </MDBox>

              {/* Tableau des tâches */}
              <DataTable
                table={{ columns, rows }}
                isSorted={false}
                entriesPerPage={false}
                showTotalEntries={false}
                noEndBorder
              />

              {selectedTask && ( // Afficher la carte de description si une tâche est sélectionnée
                <MDBox mt={4} p={3} boxShadow={3} borderRadius="lg">
                  <MDBox display="flex" justifyContent="space-between" alignItems="center">
                    <MDTypography variant="h6" color="info">
                      Description de la tâche : {selectedTask.name}
                    </MDTypography>
                    <MDButton
                      variant="gradient"
                      color="error"
                      size="small"
                      onClick={() => setSelectedTask(null)}
                    >
                      Fermer
                    </MDButton>
                  </MDBox>
                  <MDTypography variant="body1" color="text">
                    {selectedTask.description || "Aucune description disponible."}
                  </MDTypography>
                </MDBox>
              )}
            </>
          )}
        </MDBox>
      </MDBox>
    </DashboardLayout>
  );
}

export default TaskList;
