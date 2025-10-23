import { derived, get, writable } from 'svelte/store';

const participantsStore = writable([]);
const selectedParticipantIdStore = writable(null);
const selectedEmergencyStore = writable(null);
const selectedChallengeStore = writable(null);
const selectedStillTimeStore = writable(null);
const activeGroupingStore = writable('participant');

function normalizeValue(value) {
	if (value === undefined || value === null) return null;
	const trimmed = String(value).trim();
	return trimmed.length ? trimmed : null;
}

function normalizeParticipants(list = []) {
	return list.map((participant, index) => ({
		...participant,
		id: participant.id || `participant-${index}`,
		index
	}));
}

function filterByField(participants, value, fieldName) {
	const normalized = normalizeValue(value);
	if (!normalized) return participants;
	return participants.filter(
		(participant) => normalizeValue(participant?.[fieldName]) === normalized
	);
}

function ensureConsistency(participants) {
	if (!participants.length) {
		selectedParticipantIdStore.set(null);
		selectedEmergencyStore.set(null);
		selectedChallengeStore.set(null);
		selectedStillTimeStore.set(null);
		activeGroupingStore.set('participant');
		return;
	}

	const currentId = get(selectedParticipantIdStore);
	const isCurrentValid =
		currentId && participants.some((participant) => participant.id === currentId);
	if (!isCurrentValid) {
		selectedParticipantIdStore.set(participants[0].id);
	}

	const currentEmergency = normalizeValue(get(selectedEmergencyStore));
	if (
		currentEmergency &&
		!participants.some(
			(participant) => normalizeValue(participant.emergencyFocus) === currentEmergency
		)
	) {
		selectedEmergencyStore.set(null);
	}

	const currentChallenge = normalizeValue(get(selectedChallengeStore));
	if (
		currentChallenge &&
		!participants.some(
			(participant) => normalizeValue(participant.challenge2050) === currentChallenge
		)
	) {
		selectedChallengeStore.set(null);
	}

	const currentStillTime = normalizeValue(get(selectedStillTimeStore));
	if (
		currentStillTime &&
		!participants.some((participant) => normalizeValue(participant.stillTime) === currentStillTime)
	) {
		selectedStillTimeStore.set(null);
	}

	const currentGrouping = get(activeGroupingStore);
	if (!['participant', 'emergency', 'challenge', 'stillTime'].includes(currentGrouping)) {
		activeGroupingStore.set('participant');
	}
}

export const participantsList = derived(participantsStore, ($participants) => $participants);

export const selectedParticipant = derived(
	[participantsStore, selectedParticipantIdStore],
	([$participants, $selectedId]) => {
		if (!$participants.length) return null;
		if ($selectedId) {
			const found = $participants.find((participant) => participant.id === $selectedId);
			if (found) return found;
		}
		return $participants[0];
	}
);

export const selectedEmergency = derived(selectedEmergencyStore, ($value) =>
	normalizeValue($value)
);
export const selectedChallenge = derived(selectedChallengeStore, ($value) =>
	normalizeValue($value)
);
export const selectedStillTime = derived(selectedStillTimeStore, ($value) =>
	normalizeValue($value)
);
export const activeGrouping = derived(activeGroupingStore, ($value) => $value ?? 'participant');

export const participantActions = {
	setParticipants(list = []) {
		const normalized = normalizeParticipants(list);
		participantsStore.set(normalized);
		ensureConsistency(normalized);
		activeGroupingStore.set('participant');
	},
	selectById(id) {
		if (typeof id !== 'string' || !id) return;
		const participants = get(participantsStore);
		const participant = participants.find((item) => item.id === id);
		if (!participant) return;

		selectedParticipantIdStore.set(participant.id);
		selectedEmergencyStore.set(normalizeValue(participant.emergencyFocus));
		selectedChallengeStore.set(normalizeValue(participant.challenge2050));
		selectedStillTimeStore.set(normalizeValue(participant.stillTime));
		activeGroupingStore.set('participant');
	},
	selectEmergencyGroup(group) {
		const normalizedGroup = normalizeValue(group);
		if (!normalizedGroup) {
			selectedEmergencyStore.set(null);
			activeGroupingStore.set('participant');
			return;
		}

		const participants = get(participantsStore);
		const scoped = filterByField(participants, normalizedGroup, 'emergencyFocus');
		if (!scoped.length) {
			selectedEmergencyStore.set(null);
			activeGroupingStore.set('participant');
			return;
		}

		selectedEmergencyStore.set(normalizedGroup);

		const currentId = get(selectedParticipantIdStore);
		const hasCurrent = currentId && scoped.some((participant) => participant.id === currentId);

		const nextParticipant = hasCurrent
			? participants.find((participant) => participant.id === currentId)
			: scoped[0];

		if (!hasCurrent) {
			selectedParticipantIdStore.set(nextParticipant.id);
		}

		selectedChallengeStore.set(normalizeValue(nextParticipant?.challenge2050));
		selectedStillTimeStore.set(normalizeValue(nextParticipant?.stillTime));
		activeGroupingStore.set('emergency');
	},
	selectChallengeGroup(group) {
		const normalizedGroup = normalizeValue(group);
		if (!normalizedGroup) {
			selectedChallengeStore.set(null);
			activeGroupingStore.set('participant');
			return;
		}

		const participants = get(participantsStore);
		const scoped = filterByField(participants, normalizedGroup, 'challenge2050');
		if (!scoped.length) {
			selectedChallengeStore.set(null);
			activeGroupingStore.set('participant');
			return;
		}

		selectedChallengeStore.set(normalizedGroup);

		const currentId = get(selectedParticipantIdStore);
		const hasCurrent = currentId && scoped.some((participant) => participant.id === currentId);

		const nextParticipant = hasCurrent
			? participants.find((participant) => participant.id === currentId)
			: scoped[0];

		if (!hasCurrent) {
			selectedParticipantIdStore.set(nextParticipant.id);
			selectedEmergencyStore.set(normalizeValue(nextParticipant?.emergencyFocus));
		}

		selectedStillTimeStore.set(normalizeValue(nextParticipant?.stillTime));
		activeGroupingStore.set('challenge');
	},
	selectStillTimeGroup(group) {
		const normalizedGroup = normalizeValue(group);
		if (!normalizedGroup) {
			selectedStillTimeStore.set(null);
			activeGroupingStore.set('participant');
			return;
		}

		const participants = get(participantsStore);
		const scoped = filterByField(participants, normalizedGroup, 'stillTime');
		if (!scoped.length) {
			selectedStillTimeStore.set(null);
			activeGroupingStore.set('participant');
			return;
		}

		const currentId = get(selectedParticipantIdStore);
		const hasCurrent = currentId && scoped.some((participant) => participant.id === currentId);

		const nextParticipant = hasCurrent
			? participants.find((participant) => participant.id === currentId)
			: scoped[0];

		if (!hasCurrent) {
			selectedParticipantIdStore.set(nextParticipant.id);
		}
		selectedEmergencyStore.set(normalizeValue(nextParticipant?.emergencyFocus));
		selectedChallengeStore.set(normalizeValue(nextParticipant?.challenge2050));
		selectedStillTimeStore.set(normalizeValue(nextParticipant?.stillTime));
		activeGroupingStore.set('stillTime');
	},
	selectNext() {
		const participants = get(participantsStore);
		if (!participants.length) return;

		const emergency = normalizeValue(get(selectedEmergencyStore));
		const stillTime = normalizeValue(get(selectedStillTimeStore));
		const scoped = emergency
			? filterByField(participants, emergency, 'emergencyFocus')
			: stillTime
				? filterByField(participants, stillTime, 'stillTime')
				: participants;

		if (!scoped.length) return;

		const currentId = get(selectedParticipantIdStore);
		const currentIndex = scoped.findIndex((participant) => participant.id === currentId);
		const baseIndex = currentIndex < 0 ? 0 : currentIndex;
		const next = scoped[(baseIndex + 1) % scoped.length];

		selectedParticipantIdStore.set(next.id);
		selectedEmergencyStore.set(normalizeValue(next.emergencyFocus));
		selectedChallengeStore.set(normalizeValue(next.challenge2050));
		selectedStillTimeStore.set(normalizeValue(next.stillTime));
	},
	selectPrevious() {
		const participants = get(participantsStore);
		if (!participants.length) return;

		const emergency = normalizeValue(get(selectedEmergencyStore));
		const stillTime = normalizeValue(get(selectedStillTimeStore));
		const scoped = emergency
			? filterByField(participants, emergency, 'emergencyFocus')
			: stillTime
				? filterByField(participants, stillTime, 'stillTime')
				: participants;

		if (!scoped.length) return;

		const currentId = get(selectedParticipantIdStore);
		const currentIndex = scoped.findIndex((participant) => participant.id === currentId);
		const baseIndex = currentIndex < 0 ? 0 : currentIndex;
		const previous = scoped[(baseIndex - 1 + scoped.length) % scoped.length];

		selectedParticipantIdStore.set(previous.id);
		selectedEmergencyStore.set(normalizeValue(previous.emergencyFocus));
		selectedChallengeStore.set(normalizeValue(previous.challenge2050));
		selectedStillTimeStore.set(normalizeValue(previous.stillTime));
	},
	reset() {
		participantsStore.set([]);
		selectedParticipantIdStore.set(null);
		selectedEmergencyStore.set(null);
		selectedChallengeStore.set(null);
		selectedStillTimeStore.set(null);
		activeGroupingStore.set('participant');
	}
};
